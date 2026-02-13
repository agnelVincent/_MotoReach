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
        ('CANCELLED','Cancelled'),
        ('WITHDRAWN', 'Withdrawn')
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


class Estimate(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SENT', 'Sent'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    LINE_ITEM_TYPE_CHOICES = [
        ('LABOR', 'Labor'),
        ('PARTS', 'Parts'),
        ('ADDITIONAL', 'Additional Costs'),
    ]

    service_request = models.ForeignKey(ServiceRequest, on_delete=models.CASCADE, related_name='estimates')
    workshop_connection = models.ForeignKey(WorkshopConnection, on_delete=models.CASCADE, related_name='estimates')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Financial fields
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Tax rate as percentage (e.g., 18.00 for 18%)")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Metadata
    notes = models.TextField(blank=True, null=True, help_text="Additional notes or comments")
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    def calculate_totals(self):
        """Calculate subtotal, tax, and total from line items"""
        line_items = self.line_items.all()
        self.subtotal = sum(item.total for item in line_items)
        
        # Calculate tax
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        
        # Calculate total after discount
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        return self.total_amount

    def save(self, *args, **kwargs):
        # Auto-calculate totals before saving
        if self.pk:  # Only calculate if estimate already exists (has line items)
            self.calculate_totals()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Estimate #{self.id} - {self.service_request.id} - {self.status}"

    class Meta:
        ordering = ['-created_at']


class EstimateLineItem(models.Model):
    LINE_ITEM_TYPE_CHOICES = [
        ('LABOR', 'Labor'),
        ('PARTS', 'Parts'),
        ('ADDITIONAL', 'Additional Costs'),
    ]

    estimate = models.ForeignKey(Estimate, on_delete=models.CASCADE, related_name='line_items')
    
    item_type = models.CharField(max_length=20, choices=LINE_ITEM_TYPE_CHOICES)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        # Recalculate estimate totals
        if self.estimate:
            self.estimate.calculate_totals()
            self.estimate.save()

    def delete(self, *args, **kwargs):
        estimate = self.estimate
        super().delete(*args, **kwargs)
        # Recalculate estimate totals after deletion
        if estimate:
            estimate.calculate_totals()
            estimate.save()

    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.unit_price} = {self.total}"

    class Meta:
        ordering = ['created_at']


class ServiceExecution(models.Model):
    service_request = models.OneToOneField(ServiceRequest, on_delete=models.CASCADE, related_name='execution')

    workshop = models.ForeignKey('accounts.Workshop', on_delete=models.CASCADE, related_name='executions')
    
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_services')
    mechanics = models.ManyToManyField('accounts.Mechanic', blank=True, related_name='assigned_executions')

    # Link to Estimate (new field)
    estimate = models.OneToOneField(Estimate, on_delete=models.SET_NULL, null=True, blank=True, related_name='execution')
    
    # Keep estimate_amount for backward compatibility - will sync with estimate.total_amount when estimate is approved
    estimate_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    escrow_paid = models.BooleanField(default=False)
    escrow_txn_id = models.CharField(max_length=100, null=True, blank=True)

    otp_code = models.CharField(max_length=6, null=True, blank=True)

    cancelled_at = models.DateTimeField(null=True, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)