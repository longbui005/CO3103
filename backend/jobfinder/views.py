from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from django.shortcuts import get_object_or_404
from django.db.models import Case, When, Value, IntegerField
from django.db.models.functions import Cast
from django.db import transaction

from .models import (
    VerifiedCompany,
    WorkFormat,
    JobType,
    Currency,
    AdministrativeUnit,
    Province,
    District,
    Ward,
    Form,
    PendingLookup,
    Application,
)
from .serializers import (
    VerifiedCompanySerializer,
    WorkFormatSerializer,
    JobTypeSerializer,
    CurrencySerializer,
    AdministrativeUnitSerializer,
    ProvinceSerializer,
    DistrictSerializer,
    WardSerializer,
    FormSerializer,
    ApplicationSerializer,
    ApplicationCreateSerializer,
)


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access if user is object owner (created_by) or admin."""

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        # Also check role
        if request.user and hasattr(request.user, 'role') and request.user.role:
            if request.user.role.code.upper() == 'ADMIN':
                return True
        return getattr(obj, 'created_by', None) == request.user


class LookupViewSetMixin:
    """Common behaviour for lookup viewsets: read for all, write for admins."""

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
        
        model = self.queryset.model if hasattr(self, 'queryset') else self.get_queryset().model
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


class VerifiedCompanyViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    serializer_class = VerifiedCompanySerializer
    lookup_field = 'code'

    def get_queryset(self):
        # Order by order field, then name, but 'other' always at the end
        return VerifiedCompany.objects.annotate(
            is_other=Case(
                When(code='other', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_other', 'order', 'name')


class WorkFormatViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    serializer_class = WorkFormatSerializer
    lookup_field = 'code'

    def get_queryset(self):
        # Order by order field, then name, but 'other' always at the end
        return WorkFormat.objects.annotate(
            is_other=Case(
                When(code='other', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_other', 'order', 'name')


class JobTypeViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    serializer_class = JobTypeSerializer
    lookup_field = 'code'

    def get_queryset(self):
        # Order by order field, then name, but 'other' always at the end
        return JobType.objects.annotate(
            is_other=Case(
                When(code='other', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_other', 'order', 'name')


class CurrencyViewSet(LookupViewSetMixin, viewsets.ModelViewSet):
    serializer_class = CurrencySerializer
    lookup_field = 'code'

    def get_queryset(self):
        # Order by order field, then name, but 'other' always at the end
        return Currency.objects.annotate(
            is_other=Case(
                When(code='other', then=Value(1)),
                default=Value(0),
                output_field=IntegerField()
            )
        ).order_by('is_other', 'order', 'name')


class AdministrativeUnitViewSet(LookupViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for administrative unit types."""
    queryset = AdministrativeUnit.objects.all()
    serializer_class = AdministrativeUnitSerializer


class ProvinceViewSet(LookupViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """Tỉnh/Thành phố trực thuộc trung ương"""
    queryset = Province.objects.filter(is_active=True).select_related('administrative_unit').order_by('name')
    serializer_class = ProvinceSerializer

    @action(detail=True, methods=['get'])
    def districts(self, request, pk=None):
        """Get districts sorted: numeric names first (sorted numerically), then alphabetic names."""
        province = self.get_object()
        districts = District.objects.filter(province=province, is_active=True).select_related('administrative_unit')
        
        # Sort: numeric names first (by numeric value), then alphabetic names
        districts = districts.annotate(
            is_numeric=Case(
                When(name__regex=r'^\d+$', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            ),
            numeric_value=Case(
                When(name__regex=r'^\d+$', then=Cast('name', IntegerField())),
                default=Value(999999),
                output_field=IntegerField()
            )
        ).order_by('is_numeric', 'numeric_value', 'name')
        
        serializer = DistrictSerializer(districts, many=True)
        return Response(serializer.data)


class DistrictViewSet(LookupViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """Quận/Huyện/Thị xã/Thành phố thuộc tỉnh"""
    serializer_class = DistrictSerializer

    def get_queryset(self):
        queryset = District.objects.filter(is_active=True).select_related('province', 'administrative_unit')
        
        # Filter by province if provided
        province_id = self.request.query_params.get('province')
        if province_id:
            queryset = queryset.filter(province_id=province_id)
        
        # Sort: numeric names first (by numeric value), then alphabetic names
        queryset = queryset.annotate(
            is_numeric=Case(
                When(name__regex=r'^\d+$', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            ),
            numeric_value=Case(
                When(name__regex=r'^\d+$', then=Cast('name', IntegerField())),
                default=Value(999999),
                output_field=IntegerField()
            )
        ).order_by('is_numeric', 'numeric_value', 'name')
        
        return queryset

    @action(detail=True, methods=['get'])
    def wards(self, request, pk=None):
        """Get wards sorted: numeric names first (sorted numerically), then alphabetic names."""
        district = self.get_object()
        wards = Ward.objects.filter(district=district, is_active=True).select_related('administrative_unit')
        
        # Sort: numeric names first (by numeric value), then alphabetic names
        wards = wards.annotate(
            is_numeric=Case(
                When(name__regex=r'^\d+$', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            ),
            numeric_value=Case(
                When(name__regex=r'^\d+$', then=Cast('name', IntegerField())),
                default=Value(999999),
                output_field=IntegerField()
            )
        ).order_by('is_numeric', 'numeric_value', 'name')
        
        serializer = WardSerializer(wards, many=True)
        return Response(serializer.data)


class WardViewSet(LookupViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """Phường/Xã/Thị trấn"""
    serializer_class = WardSerializer

    def get_queryset(self):
        queryset = Ward.objects.filter(is_active=True).select_related('district', 'administrative_unit')
        
        # Filter by district if provided
        district_id = self.request.query_params.get('district')
        if district_id:
            queryset = queryset.filter(district_id=district_id)
        
        # Sort: numeric names first (by numeric value), then alphabetic names
        queryset = queryset.annotate(
            is_numeric=Case(
                When(name__regex=r'^\d+$', then=Value(0)),
                default=Value(1),
                output_field=IntegerField()
            ),
            numeric_value=Case(
                When(name__regex=r'^\d+$', then=Cast('name', IntegerField())),
                default=Value(999999),
                output_field=IntegerField()
            )
        ).order_by('is_numeric', 'numeric_value', 'name')
        
        return queryset


class FormViewSet(viewsets.ModelViewSet):
    """List/create/update job forms.

    - List: public returns only active & published items; authenticated users also see their own.
    - Retrieve: public allowed for published items; owner/staff can access all.
    - Create: authenticated users only.
    - Update/Delete: owner or admin.
    """

    queryset = Form.objects.select_related('verified_company', 'work_format', 'job_type', 'salary_currency').all()
    serializer_class = FormSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        from django.db.models import Q
        qs = super().get_queryset()
        user = self.request.user
        
        # Define status codes where jobs should be hidden
        # LOCKED and BANNED: hide all jobs
        # INACTIVE: jobs still visible
        # SUSPENDED: jobs still visible
        hidden_owner_statuses = ['LOCKED', 'BANNED']
        
        # Base filter: exclude jobs from users with hidden statuses (for non-admin)
        def exclude_hidden_owners(queryset):
            return queryset.exclude(
                created_by__status__code__in=hidden_owner_statuses
            )
        
        # Staff or admin role can see all statuses but only active jobs
        if user.is_authenticated:
            is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
            if is_admin:
                return qs.filter(is_active=True)

        # Authenticated users see: approved & active jobs + their own active jobs (any status)
        if user.is_authenticated:
            base_qs = qs.filter(
                Q(status='approved', is_active=True) | Q(created_by=user, is_active=True)
            )
            # Exclude jobs from hidden owners (except user's own jobs)
            return base_qs.exclude(
                ~Q(created_by=user) & Q(created_by__status__code__in=hidden_owner_statuses)
            )

        # Anonymous: only approved & active jobs, excluding hidden owners
        return exclude_hidden_owners(qs.filter(status='approved', is_active=True))

    def perform_create(self, serializer):
        # set created_by if available
        obj = serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
        # create PendingLookup entries for any other-texts provided
        self._create_pending_for_others(obj, serializer.validated_data)

    def perform_update(self, serializer):
        obj = serializer.save()
        self._create_pending_for_others(obj, serializer.validated_data)

    def _create_pending_for_others(self, form_obj, validated_data):
        # validated_data contains instances for SlugRelatedFields
        # create PendingLookup for any *_other fields where FK has code 'other'
        user = self.request.user if self.request.user.is_authenticated else None

        def maybe_create(lookup_type, fk_obj, other_value):
            if other_value and fk_obj is not None and getattr(fk_obj, 'code', '').lower() == 'other':
                # avoid duplicate proposals for same form+value
                exists = PendingLookup.objects.filter(lookup_type=lookup_type, proposed_value=other_value, form=form_obj).exists()
                if not exists:
                    PendingLookup.objects.create(
                        lookup_type=lookup_type,
                        proposed_value=other_value,
                        form=form_obj,
                        submitted_by=user,
                    )

        maybe_create('verifiedcompany', validated_data.get('verified_company'), validated_data.get('verified_company_other'))
        maybe_create('workformat', validated_data.get('work_format'), validated_data.get('work_format_other'))
        maybe_create('jobtype', validated_data.get('job_type'), validated_data.get('job_type_other'))
        maybe_create('currency', validated_data.get('salary_currency'), validated_data.get('salary_currency_other'))

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        """Admin action to approve a job posting."""
        user = request.user
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        if not is_admin:
            return Response({'detail': 'Only admins can approve jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        form = self.get_object()
        form.status = 'approved'
        form.save()
        return Response({'detail': 'Job approved successfully.', 'status': form.status})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        """Admin action to reject a job posting."""
        user = request.user
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        if not is_admin:
            return Response({'detail': 'Only admins can reject jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        form = self.get_object()
        form.status = 'rejected'
        form.save()
        return Response({'detail': 'Job rejected successfully.', 'status': form.status})

    def perform_destroy(self, instance):
        """Soft delete: set is_active = False instead of deleting."""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def hidden(self, request):
        """Admin action to list hidden (soft-deleted) jobs."""
        user = request.user
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        if not is_admin:
            return Response({'detail': 'Only admins can view hidden jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        qs = Form.objects.filter(is_active=False)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def restore(self, request, pk=None):
        """Admin action to restore a hidden job."""
        user = request.user
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        if not is_admin:
            return Response({'detail': 'Only admins can restore jobs.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            form = Form.objects.get(pk=pk)
        except Form.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        form.is_active = True
        form.save()
        return Response({'detail': 'Job restored successfully.'})


class PendingLookupViewSet(viewsets.ReadOnlyModelViewSet):
    """Admins can list and review pending lookups via admin; expose read-only view for transparency."""

    queryset = PendingLookup.objects.all()
    permission_classes = [permissions.IsAdminUser]

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class ApplicationViewSet(viewsets.ModelViewSet):
    """
    Application (Đơn ứng tuyển) endpoints.
    
    - Applicants can: create, list their own, view their own
    - Employers can: list applications for their jobs, update status
    - Admin can: view all
    """
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ApplicationCreateSerializer
        return ApplicationSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Application.objects.none()
        
        # Admin sees all
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        if is_admin:
            return Application.objects.select_related('form', 'applicant').all()
        
        # If this user has created any forms, treat them as the job owner (employer)
        try:
            from .models import Form as JobFormModel
            if JobFormModel.objects.filter(created_by=user).exists():
                return Application.objects.select_related('form', 'applicant').filter(
                    form__created_by=user
                )
        except Exception:
            # fallback to role-based check if something goes wrong
            pass

        # Job seeker sees their own applications
        return Application.objects.select_related('form', 'applicant').filter(
            applicant=user
        )
    
    def perform_create(self, serializer):
        serializer.save()
    
    def update(self, request, *args, **kwargs):
        """Only employer (job owner) or admin can update status."""
        instance = self.get_object()
        user = request.user
        
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        is_job_owner = instance.form.created_by == user
        
        if not (is_admin or is_job_owner):
            return Response(
                {'detail': 'Only the job poster or admin can update application status.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only allow status updates (employers shouldn't edit cover_letter, etc.)
        if not is_admin:
            allowed_fields = {'status'}
            if set(request.data.keys()) - allowed_fields:
                return Response(
                    {'detail': 'Employers can only update the status field.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Only the applicant or admin can withdraw/delete an application."""
        instance = self.get_object()
        user = request.user
        
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        is_applicant = instance.applicant == user
        
        if not (is_admin or is_applicant):
            return Response(
                {'detail': 'Only the applicant or admin can withdraw this application.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'], url_path='for-job/(?P<job_id>[^/.]+)')
    def for_job(self, request, job_id=None):
        """Get all applications for a specific job (employer/admin only)."""
        user = request.user
        
        try:
            form = Form.objects.get(pk=job_id)
        except Form.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        is_job_owner = form.created_by == user
        
        if not (is_admin or is_job_owner):
            return Response(
                {'detail': 'Only the job poster or admin can view applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        applications = Application.objects.select_related('applicant').filter(form=form)
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """Employer/admin action to approve an application."""
        instance = self.get_object()
        user = request.user
        
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        is_job_owner = instance.form.created_by == user
        
        if not (is_admin or is_job_owner):
            return Response(
                {'detail': 'Only the job poster or admin can approve applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.status = 'approved'
        instance.save()
        return Response(ApplicationSerializer(instance).data)
    
    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """Employer/admin action to reject an application."""
        instance = self.get_object()
        user = request.user
        
        is_admin = user.is_staff or (hasattr(user, 'role') and user.role and user.role.code.upper() == 'ADMIN')
        is_job_owner = instance.form.created_by == user
        
        if not (is_admin or is_job_owner):
            return Response(
                {'detail': 'Only the job poster or admin can reject applications.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.status = 'rejected'
        instance.save()
        return Response(ApplicationSerializer(instance).data)
