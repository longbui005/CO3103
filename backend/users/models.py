from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)

class Role(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name

class Gender(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name
    
class Status(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text='Icon name from lucide-react')
    color = models.CharField(max_length=50, blank=True, help_text='Tailwind color classes')
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'code']

    def __str__(self):
        return self.name

class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def get_by_natural_key(self, username):
        return self.get(**{self.model.USERNAME_FIELD: username.strip().casefold()})

    def _create_user(self, username, email, phone, password, **extra_fields):
        """Create and save a user with the given username and email."""
        if not username:
            raise ValueError('Username is required.')
        username_norm = self.model.normalize_username(username)

        if not email:
            raise ValueError('Email is required.')
        # Use manager's normalize_email (inherited from BaseUserManager)
        email_norm = self.normalize_email(email)

        phone_value = phone or ''
        user = self.model(
            username=username_norm,
            email=email_norm,
            phone=phone_value,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, phone=None, password=None, **extra_fields):
        extra_fields.setdefault('role_id', 'USER')
        extra_fields.setdefault('status_id', 'PENDING_VERIFICATION')
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('is_active', True)
        return self._create_user(username, email, phone, password, **extra_fields)

    def create_superuser(self, username, email=None, phone=None, password=None, **extra_fields):
        extra_fields.setdefault('role_id', 'ADMIN')
        extra_fields.setdefault('status_id', 'ACTIVE')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, phone, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=False, unique=True, null=False)
    phone = models.CharField(max_length=15, blank=True)
    role = models.ForeignKey(Role, to_field='code', db_column='role_code', on_delete=models.SET_NULL, null=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    avatar = models.URLField(max_length=500, null=True, blank=True)  # Cloudinary URL
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    status = models.ForeignKey(Status, to_field='code', db_column='status_code', on_delete=models.SET_NULL, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.email})"

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    dob = models.DateField(null=True, blank=True)
    gender = models.ForeignKey(Gender, to_field='code', db_column='gender_code', on_delete=models.SET_NULL, null=True)
    bio = models.TextField(blank=True)
    cv = models.URLField(max_length=500, null=True, blank=True)  # Cloudinary URL for CV
    cv_filename = models.CharField(max_length=255, null=True, blank=True)  # Original filename

    def __str__(self):
        user_repr = getattr(self.user, 'username', str(self.user))
        return f"{user_repr}"