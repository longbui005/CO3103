from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.utils.text import slugify
from django.core.exceptions import ValidationError

from users.models import CustomUser

class VerifiedCompany(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
    
class WorkFormat(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name
    
class JobType(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name
    
class Currency(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50, unique=True)
    symbol = models.CharField(max_length=10, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name

class AdministrativeUnit(models.Model):
    """
    Loại đơn vị hành chính: Thành phố trực thuộc trung ương, Tỉnh, Quận, Huyện, Phường, Xã, ...
    Maps to AdministrativeUnits.json
    """
    id = models.IntegerField(primary_key=True)  # Use Id from JSON directly
    full_name = models.CharField(max_length=100)  # "Thành phố trực thuộc trung ương"
    english_full_name = models.CharField(max_length=100)  # "Municipality"
    short_name = models.CharField(max_length=50)  # "Thành phố"
    english_short_name = models.CharField(max_length=50)  # "City"

    def __str__(self):
        return self.full_name


class Province(models.Model):
    """
    Tỉnh/Thành phố trực thuộc trung ương (63 tỉnh thành)
    Maps to Provinces.json
    """
    id = models.CharField(max_length=30, primary_key=True)  # ULID from JSON
    code = models.CharField(max_length=10, unique=True, db_index=True)  # "01", "02", ...
    name = models.CharField(max_length=100)  # "Hà Nội"
    english_name = models.CharField(max_length=100, blank=True)  # "Ha Noi"
    full_name = models.CharField(max_length=150)  # "Thành phố Hà Nội"
    english_full_name = models.CharField(max_length=150, blank=True)  # "Ha Noi City"
    administrative_unit = models.ForeignKey(
        AdministrativeUnit,
        on_delete=models.SET_NULL,
        null=True,
        related_name='provinces'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return self.name


class District(models.Model):
    """
    Quận/Huyện/Thị xã/Thành phố thuộc tỉnh
    Maps to Districts.json
    """
    id = models.CharField(max_length=30, primary_key=True)  # ULID from JSON
    code = models.CharField(max_length=10, unique=True, db_index=True)  # "001", "002", ...
    name = models.CharField(max_length=100)  # "Ba Đình"
    english_name = models.CharField(max_length=100, blank=True)  # "Ba Dinh"
    full_name = models.CharField(max_length=150)  # "Quận Ba Đình"
    english_full_name = models.CharField(max_length=150, blank=True)  # "Ba Dinh District"
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        related_name='districts',
        to_field='id'
    )
    administrative_unit = models.ForeignKey(
        AdministrativeUnit,
        on_delete=models.SET_NULL,
        null=True,
        related_name='districts'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.name}, {self.province.name}"


class Ward(models.Model):
    """
    Phường/Xã/Thị trấn
    Maps to Wards.json
    """
    id = models.CharField(max_length=30, primary_key=True)  # ULID from JSON
    code = models.CharField(max_length=10, unique=True, db_index=True)  # "00001", "00004", ...
    name = models.CharField(max_length=100)  # "Phúc Xá"
    english_name = models.CharField(max_length=100, blank=True)  # "Phuc Xa"
    full_name = models.CharField(max_length=150)  # "Phường Phúc Xá"
    english_full_name = models.CharField(max_length=150, blank=True)  # "Phuc Xa Ward"
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        related_name='wards',
        to_field='id'
    )
    administrative_unit = models.ForeignKey(
        AdministrativeUnit,
        on_delete=models.SET_NULL,
        null=True,
        related_name='wards'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']

    def __str__(self):
        return f"{self.name}, {self.district.name}"

class PendingLookup(models.Model):
    LOOKUP_CHOICES = [
        ('verifiedcompany', 'VerifiedCompany'),
        ('workformat', 'WorkFormat'),
        ('jobtype', 'JobType'),
        ('currency', 'Currency'),
    ]
    lookup_type = models.CharField(max_length=32, choices=LOOKUP_CHOICES)
    proposed_value = models.CharField(max_length=255)
    form = models.ForeignKey('Form', null=True, blank=True, on_delete=models.SET_NULL)
    submitted_by = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(CustomUser, null=True, blank=True, related_name='reviewed_pending_lookups', on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.lookup_type}: {self.proposed_value}"
    
class Form(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ duyệt'),
        ('approved', 'Được duyệt'),
        ('rejected', 'Bị từ chối'),
    ]

    verified_company = models.ForeignKey(
        VerifiedCompany,
        on_delete=models.PROTECT,
        related_name='forms',
        help_text='The company that posted this job'
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_forms'
    )
    title = models.CharField(max_length=255)
    contact_email = models.EmailField(blank=True)
    application_email = models.EmailField(blank=True)
    application_url = models.URLField(blank=True)

    # Location / format - Vietnam administrative hierarchy
    province = models.ForeignKey(Province, on_delete=models.SET_NULL, null=True, blank=True, related_name='forms')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='forms')
    ward = models.ForeignKey(Ward, on_delete=models.SET_NULL, null=True, blank=True, related_name='forms')
    address = models.CharField(max_length=255, blank=True)

    # Salary: allow a range and a currency
    salary_from = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Minimum salary (optional)'
    )
    salary_to = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Maximum salary (optional)'
    )
    salary_currency = models.ForeignKey(
        Currency,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='forms'
    )

    number_of_positions = models.PositiveIntegerField(default=1)

    # If user selected 'other' in a lookup, they can provide free-text here
    work_format_other = models.CharField(max_length=255, blank=True)
    job_type_other = models.CharField(max_length=255, blank=True)
    verified_company_other = models.CharField(max_length=255, blank=True)
    salary_currency_other = models.CharField(max_length=50, blank=True)

    work_format = models.ForeignKey(WorkFormat, on_delete=models.SET_NULL, null=True, related_name='forms')
    job_type = models.ForeignKey(JobType, on_delete=models.SET_NULL, null=True, related_name='forms')

    description = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    required_experience = models.CharField(max_length=255, blank=True)
    benefits = models.TextField(blank=True)

    # Status & timestamps
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['created_at', 'status'])]

    def __str__(self):
        company = self.verified_company.name if self.verified_company else 'Unknown'
        return f"{self.title} — {company}"

    def is_active_and_approved(self):
        if not self.is_active or self.status != 'approved':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

    def clean(self):
        errors = {}

        def is_other_fk(fk_obj):
            return fk_obj is not None and getattr(fk_obj, 'code', '').lower() == 'other'

        if is_other_fk(self.work_format) and not self.work_format_other:
            errors['work_format_other'] = 'Provide a custom work format when "Other" is selected.'
        if is_other_fk(self.job_type) and not self.job_type_other:
            errors['job_type_other'] = 'Provide a custom job type when "Other" is selected.'
        if is_other_fk(self.verified_company) and not self.verified_company_other:
            errors['verified_company_other'] = 'Provide company name when "Other" is selected.'
        if self.salary_currency and getattr(self.salary_currency, 'code', '').lower() == 'other' and not self.salary_currency_other:
            errors['salary_currency_other'] = 'Provide currency text when "Other" is selected.'

        if errors:
            raise ValidationError(errors)

    # Display helpers: use FK.name unless code == 'other' then return the custom text
    @property
    def display_work_format(self):
        if self.work_format and getattr(self.work_format, 'code', '').lower() != 'other':
            return self.work_format.name
        return self.work_format_other or None

    @property
    def display_job_type(self):
        if self.job_type and getattr(self.job_type, 'code', '').lower() != 'other':
            return self.job_type.name
        return self.job_type_other or None

    @property
    def display_verified_company(self):
        if self.verified_company and getattr(self.verified_company, 'code', '').lower() != 'other':
            return self.verified_company.name
        return self.verified_company_other or None

    @property
    def display_salary_currency(self):
        if self.salary_currency and getattr(self.salary_currency, 'code', '').lower() != 'other':
            return self.salary_currency.name
        return self.salary_currency_other or None


class Application(models.Model):
    """Đơn ứng tuyển - lưu thông tin ứng viên nộp đơn vào job"""
    STATUS_CHOICES = [
        ('pending', 'Chờ xử lý'),
        ('approved', 'Được chấp nhận'),
        ('rejected', 'Bị từ chối'),
    ]
    
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    applicant = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    cover_letter = models.TextField(blank=True)
    cv_url = models.URLField(blank=True, help_text='Link to CV (Cloudinary or external)')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-applied_at']
        unique_together = ['form', 'applicant']  # Mỗi user chỉ ứng tuyển 1 lần/job
    
    def __str__(self):
        return f"{self.applicant.username} → {self.form.title}"