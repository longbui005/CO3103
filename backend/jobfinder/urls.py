from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    VerifiedCompanyViewSet,
    WorkFormatViewSet,
    JobTypeViewSet,
    CurrencyViewSet,
    AdministrativeUnitViewSet,
    ProvinceViewSet,
    DistrictViewSet,
    WardViewSet,
    FormViewSet,
    PendingLookupViewSet,
    ApplicationViewSet,
)

router = DefaultRouter()
router.register(r'verified-companies', VerifiedCompanyViewSet, basename='verifiedcompany')
router.register(r'work-formats', WorkFormatViewSet, basename='workformat')
router.register(r'job-types', JobTypeViewSet, basename='jobtype')
router.register(r'currencies', CurrencyViewSet, basename='currency')
router.register(r'administrative-units', AdministrativeUnitViewSet, basename='administrativeunit')
router.register(r'provinces', ProvinceViewSet, basename='province')
router.register(r'districts', DistrictViewSet, basename='district')
router.register(r'wards', WardViewSet, basename='ward')
router.register(r'forms', FormViewSet, basename='form')
router.register(r'pending-lookups', PendingLookupViewSet, basename='pendinglookup')
router.register(r'applications', ApplicationViewSet, basename='application')

urlpatterns = [
    path('', include(router.urls)),
]
