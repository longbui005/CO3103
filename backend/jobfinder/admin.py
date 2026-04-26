from django.contrib import admin
from django.utils import timezone
from django.utils.text import slugify

from .models import (
    VerifiedCompany,
    WorkFormat,
    JobType,
    Currency,
    Form,
    PendingLookup,
)


@admin.register(PendingLookup)
class PendingLookupAdmin(admin.ModelAdmin):
    list_display = ('lookup_type', 'proposed_value', 'form', 'submitted_by', 'created_at', 'is_approved')
    list_filter = ('lookup_type', 'is_approved')
    actions = ['approve_selected']

    def approve_selected(self, request, queryset):
        created = 0
        for obj in queryset.filter(is_approved=False):
            val = obj.proposed_value.strip()
            # create corresponding lookup row
            if obj.lookup_type == 'workformat':
                WorkFormat.objects.get_or_create(code=slugify(val)[:20] or 'other', defaults={'name': val, 'description': ''})
            elif obj.lookup_type == 'jobtype':
                JobType.objects.get_or_create(code=slugify(val)[:20] or 'other', defaults={'name': val, 'description': ''})
            elif obj.lookup_type == 'currency':
                Currency.objects.get_or_create(code=slugify(val)[:10] or 'other', defaults={'name': val, 'symbol': ''})
            elif obj.lookup_type == 'verifiedcompany':
                VerifiedCompany.objects.get_or_create(code=slugify(val)[:20] or 'other', defaults={'name': val, 'website': '', 'description': ''})

            obj.is_approved = True
            obj.reviewed_at = timezone.now()
            obj.reviewed_by = request.user
            obj.save()
            created += 1

        self.message_user(request, f"Approved {created} pending lookup(s).")


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('title', 'display_verified_company', 'display_work_format', 'display_job_type', 'status', 'is_active', 'created_at')
    list_filter = ('status', 'is_active')
    readonly_fields = ('display_verified_company', 'display_work_format', 'display_job_type')


@admin.register(VerifiedCompany)
class VerifiedCompanyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')


@admin.register(WorkFormat)
class WorkFormatAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')


@admin.register(JobType)
class JobTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active')


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'symbol', 'is_active')
