from django.db import models
from django.conf import settings
from service_request.models import ServiceRequest

class Complaint(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('RESOLVED', 'Resolved'),
    ]
    
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints_reported')
    reported_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints_received')
    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='complaints')
    
    description = models.TextField()
    image = models.URLField(max_length=500, null=True, blank=True)
    phone_number = models.CharField(max_length=20)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Complaint by {self.reporter.email} against {self.reported_user.email}"
