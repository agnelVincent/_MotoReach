from django.utils import timezone
from payments.utils import check_and_process_refund

def check_request_expiration(service_request):

    if service_request.status in ['COMPLETED', 'CANCELLED', 'EXPIRED', 'VERIFIED']:
        return False

    if not service_request.expires_at:
        return False

    if service_request.expires_at < timezone.now():
        from .models import ServiceExecution

        is_refunded, msg = check_and_process_refund(service_request)
        
        service_request.status = 'EXPIRED'
        service_request.save()

        try:
            execution = service_request.execution
            if execution:
                for mechanic in execution.mechanics.all():
                    mechanic.availability = 'AVAILABLE'
                    mechanic.save()
                execution.delete()
        except ServiceExecution.DoesNotExist:
            pass

        return True
    
    return False
