from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime

class ServiceRequest(models.Model):
    STATUS_CHOICES = [
        ('CREATED','Created'),
        ('PLATFORM_FEE_PAID','Platform Fee Paid'),
        ('CONNECTING','Connecting Workshops'),
        ('CONNECTED','Connected'),
        ('ESTIMATE_SHARED','Estimate Shared'),
        ('SERVICE_AMOUNT_PAID','Service Amount Paid'),
        ('IN_PROGRESS','In Progress'),
        ('COMPLETED', 'Completed'),
        ('VERIFIED','Verified'),
        ('EXPIRED','Expired'),
        ('CANCELLED','Cancelled')
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='service_requests'
    )

    vehicle_type = models.CharField(max_length=50)
    vehicle_model = models.CharField(max_length=50)
    issue_category = models.CharField(max_length=50)
    description = models.TextField()

    image_urls = models.JSONField(default=list, blank=True)

    user_latitude = models.FloatField()
    user_longitude = models.FloatField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')

    platform_fee_paid = models.BooleanField(default=False)
    platform_fee_txn_id = models.CharField(max_length=100, null=True, blank=True)

    expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):

        is_new = self.pk is None
        
        if is_new:
            if not self.expires_at:
                 self.expires_at = timezone.now() + datetime.timedelta(minutes=30)
        
        else:
            try:
                old_instance = ServiceRequest.objects.get(pk=self.pk)
                if not old_instance.platform_fee_paid and self.platform_fee_paid:
                    self.expires_at = timezone.now() + datetime.timedelta(days=7)
            except ServiceRequest.DoesNotExist:
                pass 

        super().save(*args, **kwargs)


class WorkshopConnection(models.Model):
    STATUS_CHOICES = [
        ('REQUESTED','Requested'),
        ('ACCEPTED','Accepted'),
        ('REJECTED','Rejected'),
        ('AUTO_REJECTED','Auto Rejected'),
        ('CANCELLED','Cancelled')
    ]

    CANCELLED_BY_CHOICES = [
        ('USER','User'),
        ('WORKSHOP','Workshop')
    ]

    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='connections')

    workshop = models.ForeignKey('accounts.Workshop', on_delete=models.CASCADE, related_name='connection_requests')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    cancelled_by = models.CharField(max_length=20, choices=CANCELLED_BY_CHOICES, null=True, blank=True)

    requested_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)


class ServiceExecution(models.Model):
    service_request = models.OneToOneField(ServiceRequest, on_delete=models.CASCADE, related_name='execution')

    workshop = models.ForeignKey('accounts.Workshop', on_delete=models.CASCADE, related_name='executions')

    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_services')

    estimate_amount = models.DecimalField(max_digits=10, decimal_places=2)

    escrow_paid = models.BooleanField(default=False)
    escrow_txn_id = models.CharField(max_length=100, null=True, blank=True)

    otp_code = models.CharField(max_length=6, null=True, blank=True)

    cancelled_at = models.DateTimeField(null=True, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)