from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.parsers import MultiPartParser, FormParser

import cloudinary
import cloudinary.uploader

from django.contrib.auth.models import update_last_login

from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction, IntegrityError

from .models import Profile, Role, Gender, Status, CustomUser
from .serializers import (
    ProfileSerializer,
    RoleSerializer,
    GenderSerializer,
    StatusSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserSelfUpdateSerializer,
    PasswordChangeSerializer,
)

# Custom Permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        return obj.user == request.user

# Lookup ViewSets

class LookupViewSetMixin:
    """Common behaviour for user lookup viewsets: read for all authenticated, write for admins."""

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'], url_path='update-order')
    def update_order(self, request):
        """Bulk update the order of lookup items."""
        items = request.data.get('items', [])
        if not items:
            return Response({'detail': 'No items provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        model = self.queryset.model
        try:
            with transaction.atomic():
                for item_data in items:
                    code = item_data.get('code')
                    order = item_data.get('order')
                    if code is not None and order is not None:
                        model.objects.filter(code=code).update(order=order)
            return Response({'detail': 'Order updated successfully.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('order', 'code')
    serializer_class = RoleSerializer
    authentication_classes = [JWTAuthentication]
    lookup_field = 'code'

class GenderViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    queryset = Gender.objects.all().order_by('order', 'code')
    serializer_class = GenderSerializer
    authentication_classes = [JWTAuthentication]
    lookup_field = 'code'

class StatusViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    queryset = Status.objects.all().order_by('order', 'code')
    serializer_class = StatusSerializer
    authentication_classes = [JWTAuthentication]
    lookup_field = 'code'

# Registration

class RegisterUserView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()
        except IntegrityError:
            return Response({"detail": "User with provided details already exists.", "hint": "Try a different username or email."}, status=status.HTTP_400_BAD_REQUEST)
        out = UserSerializer(user, context={'request': request})
        return Response(out.data, status=status.HTTP_201_CREATED)

# User ViewSet

class MeUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)
    
    def patch(self, request):
        serializer = UserSelfUpdateSerializer(instance=request.user, data=request.data, partial=True, context={'request': request})
        
        try:
            serializer.is_valid(raise_exception=True)
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return Response({"detail": "Update failed due to integrity error."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(request.user, context={'request': request}).data)

# Change Password View

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


class IsAdminOrReadSingleUser(permissions.BasePermission):
    """
    Allow admin full access.
    Allow authenticated users to retrieve a single user (for viewing applicant profiles).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Admin has full access
        if request.user.is_staff:
            return True
        if hasattr(request.user, 'role') and request.user.role:
            if request.user.role.code.upper() == 'ADMIN':
                return True
        
        # Non-admin can only retrieve single user, not list
        if view.action == 'retrieve':
            return True
        
        return False


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet to manage users. Admin can list all, others can only retrieve single user."""
    queryset = CustomUser.objects.select_related('role', 'status').all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadSingleUser]
    authentication_classes = [JWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role__code', 'status__code', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username']
    ordering = ['-date_joined']

    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to check status for non-admin users."""
        instance = self.get_object()
        
        # Admin can always view
        is_admin = request.user.is_staff or (hasattr(request.user, 'role') and request.user.role and request.user.role.code.upper() == 'ADMIN')
        
        if not is_admin:
            user_status = getattr(instance, 'status', None)
            status_code = user_status.code.upper() if user_status else None
            
            # Check profile visibility based on status
            if status_code in ['INACTIVE', 'LOCKED', 'BANNED']:
                return Response({'detail': 'Không thể xem trang cá nhân của người dùng này.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='set-status')
    def set_status(self, request, pk=None):
        """Admin action to change a user's status."""
        from .models import Status
        user_obj = self.get_object()
        status_code = request.data.get('status')
        if not status_code:
            return Response({'detail': 'Status code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            new_status = Status.objects.get(code=status_code)
        except Status.DoesNotExist:
            return Response({'detail': 'Invalid status code.'}, status=status.HTTP_400_BAD_REQUEST)
        user_obj.status = new_status
        user_obj.save()
        return Response({'detail': f'User status updated to {new_status.name}.', 'status': new_status.code})


class AvatarUploadView(APIView):
    """Upload avatar for current user to Cloudinary."""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if 'avatar' not in request.FILES:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response({'detail': 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File too large. Maximum size is 5MB.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Delete old avatar from Cloudinary if exists
            if request.user.avatar:
                # Extract public_id from URL
                old_url = request.user.avatar
                if 'cloudinary' in old_url:
                    # Extract public_id: jobfinder/avatars/user_123
                    parts = old_url.split('/')
                    if 'avatars' in parts:
                        idx = parts.index('avatars')
                        public_id = '/'.join(parts[idx:]).split('.')[0]
                        public_id = f"jobfinder/{public_id}"
                        cloudinary.uploader.destroy(public_id)
            
            # Upload to Cloudinary with transformations
            result = cloudinary.uploader.upload(
                avatar_file,
                folder='jobfinder/avatars',
                public_id=f'user_{request.user.id}',
                overwrite=True,
                transformation=[
                    {'width': 200, 'height': 200, 'crop': 'fill', 'gravity': 'face'},
                    {'quality': 'auto', 'fetch_format': 'auto'}
                ]
            )
            
            avatar_url = result['secure_url']
            
            # Save URL to user model
            request.user.avatar = avatar_url
            request.user.save(update_fields=['avatar'])
            
            return Response({'avatar': avatar_url}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'detail': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        """Delete avatar from Cloudinary."""
        if request.user.avatar:
            try:
                # Delete from Cloudinary
                public_id = f'jobfinder/avatars/user_{request.user.id}'
                cloudinary.uploader.destroy(public_id)
                
                request.user.avatar = None
                request.user.save(update_fields=['avatar'])
                return Response({'detail': 'Avatar deleted.'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'detail': f'Delete failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'detail': 'No avatar to delete.'}, status=status.HTTP_404_NOT_FOUND)


class CVUploadView(APIView):
    """Upload CV for current user to Cloudinary."""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Get current user's CV info."""
        try:
            profile = request.user.profile
            if profile.cv:
                return Response({
                    'cv': profile.cv,
                    'filename': profile.cv_filename
                }, status=status.HTTP_200_OK)
            return Response({'cv': None, 'filename': None}, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response({'cv': None, 'filename': None}, status=status.HTTP_200_OK)

    def post(self, request):
        if 'cv' not in request.FILES:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        
        cv_file = request.FILES['cv']
        
        # Validate file type
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        allowed_extensions = ['.pdf', '.doc', '.docx']
        
        file_ext = '.' + cv_file.name.split('.')[-1].lower() if '.' in cv_file.name else ''
        
        if cv_file.content_type not in allowed_types and file_ext not in allowed_extensions:
            return Response({'detail': 'Invalid file type. Allowed: PDF, DOC, DOCX.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 10MB)
        if cv_file.size > 10 * 1024 * 1024:
            return Response({'detail': 'File too large. Maximum size is 10MB.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get or create profile
            profile, _ = Profile.objects.get_or_create(user=request.user)
            
            # Delete old CV from Cloudinary if exists
            if profile.cv and 'cloudinary' in profile.cv:
                parts = profile.cv.split('/')
                if 'cvs' in parts:
                    idx = parts.index('cvs')
                    public_id = '/'.join(parts[idx:]).split('.')[0]
                    public_id = f"jobfinder/{public_id}"
                    cloudinary.uploader.destroy(public_id, resource_type='raw')
            
            # Upload to Cloudinary as raw file
            result = cloudinary.uploader.upload(
                cv_file,
                folder='jobfinder/cvs',
                public_id=f'user_{request.user.id}_cv',
                overwrite=True,
                resource_type='raw'  # Important for non-image files
            )
            
            cv_url = result['secure_url']
            
            # Save URL and filename to profile
            profile.cv = cv_url
            profile.cv_filename = cv_file.name
            profile.save(update_fields=['cv', 'cv_filename'])
            
            return Response({
                'cv': cv_url,
                'filename': cv_file.name
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'detail': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        """Delete CV from Cloudinary."""
        try:
            profile = request.user.profile
            if profile.cv:
                # Delete from Cloudinary
                public_id = f'jobfinder/cvs/user_{request.user.id}_cv'
                cloudinary.uploader.destroy(public_id, resource_type='raw')
                
                profile.cv = None
                profile.cv_filename = None
                profile.save(update_fields=['cv', 'cv_filename'])
                return Response({'detail': 'CV deleted.'}, status=status.HTTP_200_OK)
            return Response({'detail': 'No CV to delete.'}, status=status.HTTP_404_NOT_FOUND)
        except Profile.DoesNotExist:
            return Response({'detail': 'No CV to delete.'}, status=status.HTTP_404_NOT_FOUND)


# Profile ViewSet

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.select_related('user', 'user__role', 'user__status', 'gender')
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    authentication_classes = [JWTAuthentication]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user__role__code', 'user__status__code', 'gender__code']
    search_fields = ['user__username', 'user__email', 'user__first_name', 'user__last_name']
    ordering_fields = ['dob', 'user__date_joined']
    ordering = ['user__date_joined']

    def get_queryset(self):
        qs = super().get_queryset()
        return qs if self.request.user.is_staff else qs.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        if request.method == 'GET':
            try:
                profile = Profile.objects.get(user=request.user)
            except Profile.DoesNotExist:
                return Response({"detail": "Profile does not exist."}, status=status.HTTP_404_NOT_FOUND)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        partial = request.method == 'PATCH'
        try:
            with transaction.atomic():
                profile, created = Profile.objects.get_or_create(user=request.user)
                serializer = self.get_serializer(profile if not created else None, data=request.data, partial=partial)
                serializer.is_valid(raise_exception=True)
                instance = serializer.save(user=request.user) if created else serializer.save()
        except IntegrityError:
            return Response({"detail": "Update failed due to integrity error."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(self.get_serializer(instance if 'instance' in locals() else profile).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check user status and restrict login accordingly
        user_status = getattr(self.user, 'status', None)
        status_code = user_status.code.upper() if user_status else None
        
        # BANNED: admin-side, khoá vĩnh viễn - không thể đăng nhập
        if status_code == 'BANNED':
            from rest_framework import serializers
            raise serializers.ValidationError({
                'detail': 'Tài khoản của bạn đã bị khoá vĩnh viễn. Vui lòng liên hệ hỗ trợ.'
            })
        
        # SUSPENDED: admin-side, tạm ngưng (nhập sai mật khẩu quá nhiều lần) - không thể đăng nhập
        if status_code == 'SUSPENDED':
            from rest_framework import serializers
            raise serializers.ValidationError({
                'detail': 'Tài khoản của bạn đang bị tạm ngưng do nhập sai mật khẩu quá nhiều lần. Vui lòng liên hệ hỗ trợ.'
            })
        
        # INACTIVE: user-side, ngưng hoạt động - cho phép đăng nhập
        # LOCKED: user-side, khoá (ẩn khỏi nền tảng) - cho phép đăng nhập
        
        try:
            update_last_login(None, self.user)
        except Exception:
            pass
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer