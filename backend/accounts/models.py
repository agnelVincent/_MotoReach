from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import is_password_usable


class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password = None, role = 'user', **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email = email, full_name = full_name, role = role, **extra_fields)

        if is_password_usable(password):
            user.password = password
        else:
            user.set_password(password)
        user.save(using = self._db)
        return user
    
    def create_superuser(self, email, full_name, password = None, **extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser',True)
        return self.create_user(email, full_name, password, role = 'admin', **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('user' , 'User'),
        ('mechanic', 'Mechanic'),
        ('workshop_admin', 'Workshop Admin'),
        ('admin', 'Admin')
    ]

    id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices= ROLE_CHOICES, default= 'user')
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        null=True,
        blank=True,
        default='profile_pictures/default.png'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return f'{self.full_name} ({self.role})'

class Workshop(models.Model):
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING','Pending'),
        ('APPROVED','Approved'),
        ('REJECTED','Rejected'),
        ('REQUESTED_AGAIN','Requested Again')
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='workshop')
    workshop_name = models.CharField(max_length=255)
    license_number = models.CharField(max_length=255, unique= True, null=True, blank=True)
    address_line = models.TextField()
    locality = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state =  models.CharField(max_length = 255)
    pincode = models.CharField(max_length=6)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    type = models.CharField(
        max_length=20,
        choices=[('INDIVIDUAL','Individual'),('TEAM','Team')],
        default='INDIVIDUAL'
    )
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    allow_self_assignments = models.BooleanField(default=True)
    contact_number = models.CharField(max_length=10, blank=True, null = True)

    def is_individual(self):
        return self.type == 'INDIVIDUAL'
    
    def __str__(self):
        return f"{self.workshop_name} ({self.type}) - {self.verification_status}"

class Mechanic(models.Model):
    AVAILABILITY_CHOICES = [
        ('AVAILABLE','Available'),
        ('BUSY','Busy')
    ]
    JOINING_STATUS_CHOICES = [
        ('PENDING','Pending'),
        ('ACCEPTED','Accepted'),
        ('REJECTED','Rejected')
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mechanic')
    workshop = models.ForeignKey(Workshop, on_delete=models.SET_NULL, null=True, blank=True, related_name='mechanics')
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='AVAILABLE')
    joining_status = models.CharField(max_length=20, choices=JOINING_STATUS_CHOICES, default='PENDING')
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    contact_number = models.CharField(max_length=15, blank=True, null=True)

    def __str__(self):
        if self.workshop:
            return f"{self.user.full_name} - {self.workshop.workshop_name}"
        return f"{self.user.full_name}"

class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=50)
    password = models.CharField(max_length=128)
    role = models.CharField(max_length=20)

    workshop_name = models.CharField(max_length=255,null = True, blank=True)
    address_line = models.CharField(max_length=255,null = True, blank=True)
    license_number = models.CharField(max_length=255, null = True, blank = True, unique=True,)
    state = models.CharField(max_length=30, null = True, blank = True)
    locality = models.CharField(max_length=255, null = True, blank=True)
    city = models.CharField(max_length=50, null = True, blank = True)
    pincode = models.CharField(max_length=6, null = True, blank = True)
    type = models.CharField(max_length=20,blank=True,null = True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    contact_number = models.CharField(null = True, blank=True)

    

class EmailOTP(models.Model):
    PURPOSE_CHOICES = (
    ('registration', 'Registration'),
    ('forgot_password', 'Forgot Password'),
    )
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default='registration')
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    resend_count = models.IntegerField(default=0)
    last_sent = models.DateTimeField(default=timezone.now)
    RESEND_DECAY_PERIOD = timedelta(hours=1)
    RESEND_LIMIT = 3
    RESEND_COOLDOWN = timedelta(seconds=60)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes = 1)
    
    def can_resend(self):
        if (timezone.now() - self.last_sent) < self.RESEND_COOLDOWN:
            print(f"Cooldown active: {self.RESEND_COOLDOWN.total_seconds() - (timezone.now() - self.last_sent).total_seconds():.0f}s left")
            return False
        
        if (timezone.now() - self.last_sent) >= self.RESEND_DECAY_PERIOD:
            return True
        
        if self.resend_count >= self.RESEND_LIMIT:
            print(f"Resend limit reached: {self.resend_count} / {self.RESEND_LIMIT}")
            return False
        
        return True