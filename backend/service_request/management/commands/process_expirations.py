from django.core.management.base import BaseCommand
from django.utils import timezone
from service_request.models import ServiceRequest
from payments.utils import check_and_process_refund

class Command(BaseCommand):
    help = 'Process expired service requests and handle refunds'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        
        # 1. Find requests that are EXPIRED based on time, but status is not updated
        # Status candidates: CREATED, FEE_PAID, CONNECTING
        expired_candidates = ServiceRequest.objects.filter(
            expires_at__lt=now,
            status__in=['CREATED', 'FEE_PAID', 'CONNECTING']
        )
        
        for req in expired_candidates:
            self.stdout.write(f"Processing expired request {req.id}...")
            
            # Check for refund eligibility
            refunded, message = check_and_process_refund(req)
            
            req.status = 'EXPIRED'
            req.save()
            
            if refunded:
                self.stdout.write(self.style.SUCCESS(f"  -> Expired & Refunded: {message}"))
            else:
                 self.stdout.write(self.style.WARNING(f"  -> Expired (No Refund): {message}"))

        self.stdout.write(self.style.SUCCESS('Expiration check complete.'))
