import stripe
from django.conf import settings
from .models import Payment

stripe.api_key = settings.STRIPE_SECRET_KEY

def check_and_process_refund(service_request):
    """
    Checks if a refund is applicable for the given service request.
    Refunds if:
    1. Platform fee was paid.
    2. User attempted connection with at least N workshops.
    3. No workshop accepted.
    4. Request is expiring (implied by caller).
    """
    if not service_request.platform_fee_paid:
        return False, "Fee not paid"

    # Check N attempts
    attempts = service_request.connections.count()
    min_attempts = getattr(settings, 'PLATFORM_FEE_MIN_WORKSHOP_ATTEMPTS', 3)
    
    if attempts < min_attempts:
        return False, f"Not enough attempts ({attempts}/{min_attempts})"

    # Check if any accepted
    if service_request.connections.filter(status='ACCEPTED').exists():
        return False, "Workshop accepted"

    # Process Refund
    try:
        payment = service_request.payments.filter(payment_type='PLATFORM_FEE', status='COMPLETED').first()
        if not payment:
            return False, "Payment transaction not found"
        
        if payment.is_refunded:
             return True, "Already refunded"

        # Stripe Refund
        refund = stripe.Refund.create(
            payment_intent=payment.stripe_payment_intent_id,
            reason='requested_by_customer' 
        )
        
        payment.status = 'REFUNDED'
        payment.is_refunded = True
        payment.refund_txn_id = refund.id
        payment.save()
        
        return True, "Refund processed"

    except Exception as e:
        # Log error?
        print(f"Refund error: {e}")
        return False, str(e)
