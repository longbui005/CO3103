from django.urls import include, path

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RoleViewSet,
    GenderViewSet,
    StatusViewSet,
    RegisterUserView,
    MeUserView,
    ChangePasswordView,
    ProfileViewSet,
    CustomTokenObtainPairView,
    UserViewSet,
    AvatarUploadView,
    CVUploadView,
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'genders', GenderViewSet, basename='gender')
router.register(r'statuses', StatusViewSet, basename='status')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('me/', MeUserView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('cv/', CVUploadView.as_view(), name='cv-upload'),
]