import stripe
from django.conf import settings
from django.db.models import F
from .models import Wallet, WalletTransaction
from django.db import transaction
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)

def get_platform_admin():
    User = get_user_model()
    
    admin = User.objects.filter(role='admin', is_superuser=True).first()
    if admin:
        logger.info(f"Superuser admin found: {admin.id} ({admin.email})")
        return admin

    admin = User.objects.filter(role='admin').first()
    if admin:
        logger.info(f"Non-superuser admin found: {admin.id} ({admin.email})")
        return admin

    logger.warning("No platform admin found")
    return None

stripe.api_key = settings.STRIPE_SECRET_KEY


def check_and_process_refund(service_request):
    if not service_request.platform_fee_paid:
        logger.info(f"Refund check failed for ServiceRequest #{service_request.id}: Fee not paid")
        return False, "Fee not paid"

    if service_request.connections.filter(status__in=['ACCEPTED', 'CANCELLED']).exists():
        logger.info(f"Refund check failed for ServiceRequest #{service_request.id}: Workshop already connected")
        return False, "Workshop connected at least once - Not eligible for refund"

    payment = service_request.payments.filter(payment_type='PLATFORM_FEE', status='COMPLETED').first()
    if not payment:
        logger.warning(f"Refund check failed for ServiceRequest #{service_request.id}: Payment transaction not found")
        return False, "Payment transaction not found"

    if payment.is_refunded:
        logger.info(f"ServiceRequest #{service_request.id} already refunded")
        return True, "Already refunded"

    try:
        with transaction.atomic():
            # Refund to user wallet
            wallet, _ = Wallet.objects.get_or_create(user=service_request.user)
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

            admin_user = get_platform_admin()
            if admin_user:
                admin_wallet, _ = Wallet.objects.get_or_create(user=admin_user)
                admin_wallet.balance = F('balance') - payment.amount
                admin_wallet.save()
                admin_wallet.refresh_from_db()

                WalletTransaction.objects.create(
                    wallet=admin_wallet,
                    amount=payment.amount,
                    transaction_type='DEBIT',
                    description=f"Platform Fee Refunded to User for Service Request #{service_request.id}"
                )

        logger.info(f"Refund processed successfully for ServiceRequest #{service_request.id}")
        return True, "Refund processed to Wallet"

    except Exception as e:
        logger.exception(f"Error processing refund for ServiceRequest #{service_request.id}")
        return False, "An unexpected error occurred while processing the refund"