from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

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
        ('EXPIRED', 'Expired'), 
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_requests')
    workshop = models.ForeignKey('accounts.Workshop', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests')
    vehicle_type = models.CharField(max_length=50) 
    vehicle_model = models.CharField(max_length=100)
    issue_category = models.CharField(max_length=100) 
    description = models.TextField()
    image_urls = models.JSONField(default=list, blank=True)
    user_latitude = models.FloatField()
    user_longitude = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')

    created_at = models.DateTimeField(auto_now_add=True)
    fee_paid_at = models.DateTimeField(null=True, blank=True)
    requested_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    expires_at = models.DateTimeField(null=True, blank=True) 
    ended_at = models.DateTimeField(null=True, blank=True)   

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=5)

        if self.status == 'REQUESTED' and not self.requested_at:
            self.requested_at = timezone.now()
            
        if self.status == 'ACCEPTED' and not self.accepted_at:
            self.accepted_at = timezone.now()

        if self.status in ['COMPLETED', 'CANCELLED', 'EXPIRED', 'VERIFIED'] and not self.ended_at:
            self.ended_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def is_past_expiry(self):
        if self.expires_at and timezone.now() > self.expires_at:
            if self.status in ['CREATED', 'REQUESTED', 'PENDING_FEE']:
                return True
        return False

    def __str__(self):
        return f"Request #{self.id} - {self.vehicle_model} ({self.status})"