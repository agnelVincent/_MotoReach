import stripe
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from .models import Payment, Wallet, WalletTransaction
from .serializers import WalletSerializer, WalletTransactionSerializer, PaymentHistorySerializer
from service_request.models import ServiceRequest, ServiceExecution, Estimate, WorkshopConnection, MechanicEarning
from service_request.utils import notify_service_flow_update,  push_connection_count_to_workshop
from .utils import get_platform_admin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django.db.models import F, Sum
from django.db import transaction, DatabaseError
from accounts.models import Workshop, Mechanic
from decimal import Decimal
from django.utils import timezone
import logging

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        service_request_id = request.data.get('service_request_id')
        workshop_id = request.data.get('workshop_id')

        logger.info(
            "Create checkout session request initiated by user_id=%s",
            request.user.id
        )

        if not service_request_id:
            logger.warning(
                "Missing service_request_id from user_id=%s",
                request.user.id
            )
            return Response(
                {'error': 'service_request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            service_request = ServiceRequest.objects.get(
                id=service_request_id,
                user=request.user
            )

        except ServiceRequest.DoesNotExist:
            logger.warning(
                "ServiceRequest not found. service_request_id=%s user_id=%s",
                service_request_id,
                request.user.id
            )
            return Response(
                {'error': 'Service Request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching ServiceRequest. "
                "service_request_id=%s user_id=%s",
                service_request_id,
                request.user.id
            )
            return Response(
                {'error': 'Something went wrong while fetching service request'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if service_request.platform_fee_paid:
            logger.info(
                "Platform fee already paid for service_request_id=%s",
                service_request.id
            )
            return Response(
                {'message': 'Platform fee already paid'},
                status=status.HTTP_200_OK
            )

        metadata = {
            'service_request_id': str(service_request.id),
            'user_id': str(request.user.id),
            'payment_type': 'PLATFORM_FEE'
        }

        if workshop_id:
            metadata['workshop_id'] = str(workshop_id)

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'unit_amount': int(
                                settings.STRIPE_PLATFORM_FEE_AMOUNT * 100
                            ),
                            'product_data': {
                                'name': 'Platform Fee',
                                'description': (
                                    f'Platform fee for service request '
                                    f'#{service_request.id}'
                                ),
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=(
                    f'http://localhost:5173/user/workshops-nearby/'
                    f'{service_request.id}?payment_success=true'
                ),
                cancel_url=(
                    f'http://localhost:5173/user/workshops-nearby/'
                    f'{service_request.id}?payment_canceled=true'
                ),
                metadata=metadata,
            )

            logger.info(
                "Stripe checkout session created successfully. "
                "checkout_session_id=%s service_request_id=%s",
                checkout_session.id,
                service_request.id
            )

        except stripe.error.CardError as e:
            logger.exception(
                "Stripe CardError for service_request_id=%s",
                service_request.id
            )
            return Response(
                {'error': e.user_message or 'Card error occurred'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.RateLimitError:
            logger.exception("Stripe rate limit exceeded")
            return Response(
                {'error': 'Too many requests to payment gateway'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        except stripe.error.InvalidRequestError as e:
            logger.exception(
                "Invalid Stripe request for service_request_id=%s",
                service_request.id
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.AuthenticationError:
            logger.exception("Stripe authentication failed")
            return Response(
                {'error': 'Payment gateway authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except stripe.error.APIConnectionError:
            logger.exception("Stripe network communication failed")
            return Response(
                {'error': 'Network error while contacting payment gateway'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        except stripe.error.StripeError:
            logger.exception(
                "Generic Stripe error for service_request_id=%s",
                service_request.id
            )
            return Response(
                {'error': 'Payment gateway error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while creating Stripe checkout session"
            )
            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            Payment.objects.create(
                user=request.user,
                service_request=service_request,
                amount=settings.STRIPE_PLATFORM_FEE_AMOUNT,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='PLATFORM_FEE',
                status='PENDING'
            )

            logger.info(
                "Payment record created successfully. "
                "checkout_session_id=%s",
                checkout_session.id
            )

        except DatabaseError:
            logger.exception(
                "Database error while creating Payment record. "
                "checkout_session_id=%s",
                checkout_session.id
            )
            return Response(
                {'error': 'Failed to save payment record'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while saving Payment record"
            )
            return Response(
                {'error': 'Unexpected database error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'url': checkout_session.url},
            status=status.HTTP_200_OK
        )


class CreateServiceEscrowCheckoutView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        estimate_id = request.data.get('estimate_id')

        logger.info(
            "Escrow checkout session request initiated by user_id=%s",
            request.user.id
        )

        if not estimate_id:
            logger.warning(
                "Missing estimate_id from user_id=%s",
                request.user.id
            )
            return Response(
                {'error': 'estimate_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch estimate
        try:
            estimate = Estimate.objects.select_related(
                'service_request',
                'service_request__user'
            ).get(pk=estimate_id)

        except Estimate.DoesNotExist:
            logger.warning(
                "Estimate not found. estimate_id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {'error': 'Estimate not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching estimate. "
                "estimate_id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {'error': 'Something went wrong while fetching estimate'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Authorization check
        if estimate.service_request.user != request.user:
            logger.warning(
                "Unauthorized escrow payment attempt. "
                "estimate_id=%s user_id=%s",
                estimate_id,
                request.user.id
            )
            return Response(
                {'error': 'Unauthorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Estimate status validation
        if estimate.status != 'APPROVED':
            logger.warning(
                "Attempt to pay non-approved estimate. "
                "estimate_id=%s status=%s",
                estimate_id,
                estimate.status
            )
            return Response(
                {'error': 'Only approved estimates can be paid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch execution
        try:
            execution = estimate.service_request.execution

        except ServiceExecution.DoesNotExist:
            logger.warning(
                "ServiceExecution not found for estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': 'Service execution not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching ServiceExecution. "
                "estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': 'Error while fetching service execution'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Already paid check
        if execution.escrow_paid:
            logger.info(
                "Escrow already paid for estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': 'Service amount already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Amount validation
        try:
            amount = float(estimate.total_amount)

        except (TypeError, ValueError):
            logger.exception(
                "Invalid estimate amount. estimate_id=%s amount=%s",
                estimate_id,
                estimate.total_amount
            )
            return Response(
                {'error': 'Invalid amount format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount <= 0:
            logger.warning(
                "Non-positive escrow amount. estimate_id=%s amount=%s",
                estimate_id,
                amount
            )
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sr_id = estimate.service_request.id
        base_url = 'http://localhost:5173'

        success_url = (
            f'{base_url}/user/service-flow/'
            f'{sr_id}?escrow_success=true'
        )

        cancel_url = (
            f'{base_url}/user/service-flow/'
            f'{sr_id}?escrow_canceled=true'
        )

        # Create Stripe checkout session
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'unit_amount': int(round(amount * 100)),
                            'product_data': {
                                'name': 'Service Amount (Escrow)',
                                'description': (
                                    f'Service request #{sr_id} '
                                    f'– amount held until completion'
                                ),
                            },
                        },
                        'quantity': 1,
                    }
                ],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'payment_type': 'SERVICE_ESCROW',
                    'service_request_id': str(sr_id),
                    'estimate_id': str(estimate_id),
                    'user_id': str(request.user.id),
                },
            )

            logger.info(
                "Stripe escrow checkout session created successfully. "
                "checkout_session_id=%s estimate_id=%s",
                checkout_session.id,
                estimate_id
            )

        except stripe.error.CardError as e:
            logger.exception(
                "Stripe CardError for estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': e.user_message or 'Card error occurred'},
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.RateLimitError:
            logger.exception("Stripe rate limit exceeded")
            return Response(
                {'error': 'Too many requests to payment gateway'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        except stripe.error.InvalidRequestError as e:
            logger.exception(
                "Invalid Stripe request for estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.AuthenticationError:
            logger.exception("Stripe authentication failed")
            return Response(
                {'error': 'Payment gateway authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except stripe.error.APIConnectionError:
            logger.exception("Stripe network communication failed")
            return Response(
                {'error': 'Network error while contacting payment gateway'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        except stripe.error.StripeError:
            logger.exception(
                "Generic Stripe error for estimate_id=%s",
                estimate_id
            )
            return Response(
                {'error': 'Payment gateway error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while creating Stripe escrow session"
            )
            return Response(
                {'error': 'Unexpected payment error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Create payment record
        try:
            Payment.objects.create(
                user=request.user,
                service_request=estimate.service_request,
                amount=estimate.total_amount,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='SERVICE_ESCROW',
                status='PENDING',
            )

            logger.info(
                "Escrow payment record created successfully. "
                "checkout_session_id=%s estimate_id=%s",
                checkout_session.id,
                estimate_id
            )

        except DatabaseError:
            logger.exception(
                "Database error while creating escrow Payment record. "
                "checkout_session_id=%s",
                checkout_session.id
            )
            return Response(
                {'error': 'Failed to save payment record'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while saving escrow Payment record"
            )
            return Response(
                {'error': 'Unexpected database error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'url': checkout_session.url},
            status=status.HTTP_200_OK
        )

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        print("=" * 50)
        print("WEBHOOK RECEIVED!")
        print(f"Method: {request.method}")
        print(f"Headers: {dict(request.META)}")
        print("=" * 50)

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
            print(f"Webhook event type: {event['type']}")
        except ValueError as e:
            print(f"Webhook ValueError: {e}")
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            print(f"Webhook SignatureVerificationError: {e}")
            return HttpResponse(status=400)

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            self.handle_checkout_session_completed(session)
        else:
            print(f"Webhook event type '{event['type']}' not handled")

        return HttpResponse(status=200)

    def handle_checkout_session_completed(self, session):
        
        try:
            payment = Payment.objects.get(stripe_checkout_id=session['id'])
            print(f"Payment found: {payment.id}, Status: {payment.status}, Service Request: {payment.service_request_id}")
        except Payment.DoesNotExist:
            print(f"ERROR: Payment not found for checkout session ID: {session['id']}")
            return

        payment.status = 'COMPLETED'
        payment.stripe_payment_intent_id = session.get('payment_intent')
        payment.save()
        print(f"Payment updated to COMPLETED")

        metadata = session.get('metadata', {}) or {}
        payment_type = metadata.get('payment_type')

        if payment_type == 'SERVICE_ESCROW':
            self._handle_service_escrow_completed(payment)
            return
        if payment_type == 'WALLET_TOPUP':
            print(f"Processing wallet topup for user {payment.user.id}")
            

            with transaction.atomic():
                wallet, created = Wallet.objects.get_or_create(user=payment.user)
                wallet.balance = F('balance') + payment.amount
                wallet.save()
                
                wallet.refresh_from_db() 

                WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=payment.amount,
                    transaction_type='CREDIT',
                    description=f"Added ₹{payment.amount:.2f} to wallet"
                )
                
            print(f"Wallet balance updated (Atomic)")
            return

        if payment_type == 'PLATFORM_FEE' and payment.service_request:
            print(f"Updating ServiceRequest {payment.service_request.id}")
            print(f"Before - platform_fee_paid: {payment.service_request.platform_fee_paid}, status: {payment.service_request.status}")
            payment.service_request.platform_fee_paid = True
            payment.service_request.platform_fee_txn_id = payment.stripe_checkout_id

            admin_user = get_platform_admin()
            if admin_user:
                with transaction.atomic():
                    admin_wallet, _ = Wallet.objects.get_or_create(user=admin_user)
                    admin_wallet.balance = F('balance') + payment.amount
                    admin_wallet.save()
                    admin_wallet.refresh_from_db()
                    WalletTransaction.objects.create(
                        wallet=admin_wallet,
                        amount=payment.amount,
                        transaction_type='CREDIT',
                        description=f"Platform Fee Collected for Service Request #{payment.service_request.id}"
                    )

            workshop_id = metadata.get('workshop_id')
            if workshop_id:
                try:
                    workshop = Workshop.objects.get(pk=workshop_id)
                    existing_connection = WorkshopConnection.objects.filter(
                        service_request=payment.service_request, 
                        status__in=['REQUESTED', 'ACCEPTED']
                    ).exists()
                    
                    previous_attempts = WorkshopConnection.objects.filter(
                        service_request=payment.service_request,
                        workshop=workshop
                    ).count()
            
                    if not existing_connection and previous_attempts < 3:
                        WorkshopConnection.objects.create(
                            service_request=payment.service_request,
                            workshop=workshop,
                            status='REQUESTED'
                        )

                        push_connection_count_to_workshop(workshop.user.id)
                        
                        payment.service_request.status = 'CONNECTING'
                    else:
                        payment.service_request.status = 'PLATFORM_FEE_PAID'

                except Workshop.DoesNotExist:
                    payment.service_request.status = 'PLATFORM_FEE_PAID'
            else:
                payment.service_request.status = 'PLATFORM_FEE_PAID'

            payment.service_request.save()
            notify_service_flow_update(payment.service_request.id)
            print(f"After - platform_fee_paid: {payment.service_request.platform_fee_paid}, status: {payment.service_request.status}")
            print("ServiceRequest updated successfully!")
        else:
            print("WARNING: Payment has no associated service_request or not PLATFORM_FEE")
        
        print("=" * 50)

    def _handle_service_escrow_completed(self, payment):
        """Mark execution as escrow paid and set service request status to SERVICE_AMOUNT_PAID."""
        if not payment.service_request_id:
            print("WARNING: SERVICE_ESCROW payment has no service_request")
            return
        try:
            execution = ServiceExecution.objects.get(service_request_id=payment.service_request_id)
        except ServiceExecution.DoesNotExist:
            print("WARNING: No ServiceExecution for escrow payment")
            return
        with transaction.atomic():
            execution.escrow_paid = True
            execution.escrow_txn_id = payment.stripe_checkout_id
            execution.save()
            payment.service_request.status = 'SERVICE_AMOUNT_PAID'
            payment.service_request.save()
            notify_service_flow_update(payment.service_request.id)
        print("SERVICE_ESCROW: execution updated, service request status = SERVICE_AMOUNT_PAID")


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            wallet, created = Wallet.objects.get_or_create(user=request.user)
            serializer = WalletSerializer(wallet)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Failed to fetch wallet details'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            wallet, created = Wallet.objects.get_or_create(user=request.user)
            transactions = wallet.transactions.all().order_by('-created_at')
            
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            start = (page - 1) * page_size
            end = start + page_size
            
            paginated_transactions = transactions[start:end]
            serializer = WalletTransactionSerializer(paginated_transactions, many=True)
            
            return Response({
                'transactions': serializer.data,
                'total': transactions.count(),
                'page': page,
                'page_size': page_size,
                'has_more': end < transactions.count()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Failed to fetch transactions'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AddMoneyCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        
        if not amount:
            return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            amount = float(amount)
            if amount <= 0:
                return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
            if amount > 100000:  
                return Response({'error': 'Amount cannot exceed ₹1,00,000'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'unit_amount': int(amount * 100),
                            'product_data': {
                                'name': 'Add Money to Wallet',
                                'description': f'Add ₹{amount:.2f} to your wallet balance',
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url='http://localhost:5173/user/wallet?add_money_success=true',
                cancel_url='http://localhost:5173/user/wallet?add_money_canceled=true',
                metadata={
                    'user_id': request.user.id,
                    'payment_type': 'WALLET_TOPUP',
                    'amount': str(amount)
                },
            )
            
            Payment.objects.create(
                user=request.user,
                amount=amount,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='SUBSCRIPTION',  
                status='PENDING'
            )

            return Response({'url': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayPlatformFeeWithWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        service_request_id = request.data.get('service_request_id')
        workshop_id = request.data.get('workshop_id')
        if not service_request_id:
            return Response({'error': 'service_request_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service_request = ServiceRequest.objects.get(id=service_request_id, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service Request not found'}, status=status.HTTP_404_NOT_FOUND)

        if service_request.platform_fee_paid:
             return Response({'message': 'Platform fee already paid'}, status=status.HTTP_200_OK)

        fee_amount = settings.STRIPE_PLATFORM_FEE_AMOUNT # Float

        try:
            with transaction.atomic():
                wallet, created = Wallet.objects.get_or_create(user=request.user)
                
                if wallet.balance < fee_amount:
                     return Response({'error': 'Insufficient wallet balance'}, status=status.HTTP_400_BAD_REQUEST)

                wallet.balance = F('balance') - fee_amount
                wallet.save()
                
                wallet.refresh_from_db()

                txn = WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=fee_amount,
                    transaction_type='DEBIT',
                    description=f"Platform Fee for Service Request #{service_request.id}"
                )

                Payment.objects.create(
                    user=request.user,
                    service_request=service_request,
                    amount=fee_amount,
                    currency=settings.STRIPE_CURRENCY,
                    stripe_checkout_id=f"WALLET-PAY-{txn.id}", 
                    payment_type='PLATFORM_FEE',
                    status='COMPLETED'
                )

                admin_user = get_platform_admin()
                if admin_user:
                    admin_wallet, _ = Wallet.objects.get_or_create(user=admin_user)
                    admin_wallet.balance = F('balance') + fee_amount
                    admin_wallet.save()
                    admin_wallet.refresh_from_db()
                    WalletTransaction.objects.create(
                        wallet=admin_wallet,
                        amount=fee_amount,
                        transaction_type='CREDIT',
                        description=f"Platform Fee Collected for Service Request #{service_request.id}"
                    )

                # Update Service Request
                service_request.platform_fee_paid = True
                
                if workshop_id:
                    try:
                        workshop = Workshop.objects.get(pk=workshop_id)
                        existing_connection = WorkshopConnection.objects.filter(
                            service_request=service_request, 
                            status__in=['REQUESTED', 'ACCEPTED']
                        ).exists()
                        
                        previous_attempts = WorkshopConnection.objects.filter(
                            service_request=service_request,
                            workshop=workshop
                        ).count()
                
                        if not existing_connection and previous_attempts < 3:
                            WorkshopConnection.objects.create(
                                service_request=service_request,
                                workshop=workshop,
                                status='REQUESTED'
                            )

                            push_connection_count_to_workshop(workshop.user.id)

                            service_request.status = 'CONNECTING'
                        else:
                            service_request.status = 'PLATFORM_FEE_PAID'
                    except Workshop.DoesNotExist:
                        service_request.status = 'PLATFORM_FEE_PAID'
                else:
                    service_request.status = 'PLATFORM_FEE_PAID'

                service_request.save()

            return Response({'message': 'Payment successful', 'wallet_balance': wallet.balance}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            payments = Payment.objects.filter(user=request.user).order_by('-created_at')
            serializer = PaymentHistorySerializer(payments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Failed to fetch payment history'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WorkshopPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            escrow_payments = Payment.objects.filter(
                payment_type='SERVICE_ESCROW',
                service_request__execution__workshop__user=request.user
            ).select_related('service_request').order_by('-created_at')

            serializer = PaymentHistorySerializer(escrow_payments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Failed to fetch workshop payment history'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class MechanicWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'mechanic'):
            return Response({'error' : 'Mechanic profile not found'}, status=status.HTTP_403_FORBIDDEN)

        try:
            try:
                mechanic = request.user.mechanic
            except Mechanic.DoesNotExist:
                return Response({'error' : 'Mechanic profile not found'}, status=status.HTTP_404_NOT_FOUND)
            
            wallet, _ = Wallet.objects.get_or_create(user = request.user)

            earning_qs = MechanicEarning.objects.filter(mechanic=mechanic)

            total_earned = earning_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            total_bonuses = earning_qs.filter(earning_type = 'BONUS').aggregate(total = Sum('amount'))['total'] or Decimal('0.00')
            total_services = earning_qs.filter(earning_type = 'SERVICE_SHARE').values('service_execution').distinct().count()

            now = timezone.now()

            this_month = earning_qs.filter(
                created_at__year = now.year,
                created_at__month = now.month
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            page = int(request.GET.get('page',1))
            page_size = int(request.GET.get('page_size',20))
            start = (page - 1) * page_size
            end = start + page_size


            earning_list = earning_qs.select_related(
                'service_execution__service_request'
            ).order_by('-created_at')[start:end]

            earning_data = []

            for e in earning_list:
                se = e.service_execution
                sr = se.service_request if se else None
                mechanic_count = se.mechanics.count() if se else 0

                earning_data.append({
                    'id' : e.id,
                    'earning_type' : e.earning_type,
                    'amount' : str(e.amount),
                    'description' : e.description,
                    'created_at' : e.created_at,
                    'service_execution' : {
                        'id' : se.id,
                        'mechanic_count' : mechanic_count,
                        'service_request' : {
                            'id' : sr.id,
                            'issue_category' : sr.issue_category,
                            'vehicle_model' : sr.vehicle_model
                        } if sr else None
                    } if se else None
                })

            return Response({
                'balance' : str(wallet.balance),
                'total_earned' : str(total_earned),
                'this_month' : str(this_month),
                'total_bonuses' : str(total_bonuses),
                'total_services' : total_services,
                'earnings' : earning_data,
                'total' : earning_qs.count(),
                'page' : page,
                'page_size' : page_size,
                'has_more' : end < earning_qs.count()
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Failed to load mechanic wallet details'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


