import stripe
from django.conf import settings
from django.db.models import F
from .models import Wallet, WalletTransaction
from django.db import transaction

stripe.api_key = settings.STRIPE_SECRET_KEY

def check_and_process_refund(service_request):

    if not service_request.platform_fee_paid:
        return False, "Fee not paid"

    if service_request.connections.filter(status__in=['ACCEPTED', 'CANCELLED']).exists():
        return False, "Workshop connected at least once - Not eligible for refund"


    payment = service_request.payments.filter(payment_type='PLATFORM_FEE', status='COMPLETED').first()
    if not payment:
        return False, "Payment transaction not found"
    
    if payment.is_refunded:
         return True, "Already refunded"

    try:

        with transaction.atomic():
            wallet, created = Wallet.objects.get_or_create(user=service_request.user)
            wallet.balance = F('balance') + payment.amount
            wallet.save()
            
            wallet.refresh_from_db()

            WalletTransaction.objects.create(
                wallet=wallet,
                amount=payment.amount,
                transaction_type='CREDIT',
                description=f"Refund for Service Request #{service_request.id} (Expired/Unconnected)"
            )

            payment.status = 'REFUNDED'
            payment.is_refunded = True
            payment.refund_txn_id = f"WALLET-REFUND-{payment.id}" 
            payment.save()
        
        return True, "Refund processed to Wallet"

    except Exception as e:
        print(f"Refund error: {e}")
        return False, str(e)
