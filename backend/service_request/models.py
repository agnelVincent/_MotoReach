from django.db import models
from django.conf import settings

class ServiceRequest(models.Model):
    STATUS_CHOICES = [
        ('CREATED', 'Created'),                   
        ('PENDING_FEE', 'Pending Platform Fee'),  
        ('REQUESTED', 'Connection Requested'),    
        ('ACCEPTED', 'Accepted'),                 
        ('REJECTED', 'Rejected'),                 
        ('ESTIMATE_SHARED', 'Estimate Shared'),   
        ('IN_PROGRESS', 'In Progress'),           
        ('COMPLETED', 'Completed'),               
        ('VERIFIED', 'Verified'),
        ('CANCELLED', 'Cancelled'),               
    ]


    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='customer_requests'
    )

    vehicle_type = models.CharField(max_length=50) 
    vehicle_model = models.CharField(max_length=100)
    issue_category = models.CharField(max_length=100) 
    description = models.TextField()
    
    image_urls = models.JSONField(default=list, blank=True)


    user_latitude = models.FloatField()
    user_longitude = models.FloatField()

    is_platform_fee_paid = models.BooleanField(default=False)
    platform_transaction_id = models.CharField(max_length=100, blank=True, null=True)


    workshop = models.ForeignKey(
        'accounts.Workshop', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='service_requests'
    )
    
    assigned_handler = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    estimate_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_escrow_paid = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)

    rejection_reason = models.TextField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cancelled_actions'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    fee_paid_at = models.DateTimeField(null=True, blank=True)
    requested_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Request #{self.id} - {self.vehicle_model} ({self.status})"