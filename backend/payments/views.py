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
                    f'{settings.FRONTEND_URL}/user/workshops-nearby/'
                    f'{service_request.id}?payment_success=true'
                ),
                cancel_url=(
                    f'{settings.FRONTEND_URL}/user/workshops-nearby/'
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
        base_url = settings.FRONTEND_URL

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

        logger.info("Stripe webhook received")

        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.STRIPE_WEBHOOK_SECRET
            )

            logger.info(
                "Stripe webhook verified successfully. event_type=%s",
                event.get('type')
            )

        except ValueError:
            logger.exception("Invalid Stripe webhook payload")
            return HttpResponse(status=400)

        except stripe.error.SignatureVerificationError:
            logger.exception("Invalid Stripe webhook signature")
            return HttpResponse(status=400)

        except Exception:
            logger.exception("Unexpected webhook verification error")
            return HttpResponse(status=500)

        try:
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']

                logger.info(
                    "Processing checkout.session.completed webhook"
                )

                self.handle_checkout_session_completed(session)

            else:
                logger.info(
                    "Unhandled Stripe webhook event type=%s",
                    event['type']
                )

        except Exception:
            logger.exception(
                "Unexpected error while processing webhook event"
            )
            return HttpResponse(status=500)

        return HttpResponse(status=200)

    def handle_checkout_session_completed(self, session):

        checkout_session_id = session.get('id')

        try:
            payment = Payment.objects.select_related(
                'service_request',
                'user'
            ).get(
                stripe_checkout_id=checkout_session_id
            )

            logger.info(
                "Payment found for webhook. payment_id=%s",
                payment.id
            )

        except Payment.DoesNotExist:
            logger.warning(
                "Payment not found for Stripe checkout session"
            )
            return

        except Exception:
            logger.exception(
                "Unexpected error while fetching payment"
            )
            return

        # Prevent duplicate processing
        if payment.status == 'COMPLETED':
            logger.info(
                "Webhook already processed for payment_id=%s",
                payment.id
            )
            return

        try:
            payment.status = 'COMPLETED'
            payment.stripe_payment_intent_id = session.get(
                'payment_intent'
            )
            payment.save()

            logger.info(
                "Payment marked as COMPLETED. payment_id=%s",
                payment.id
            )

        except Exception:
            logger.exception(
                "Failed to update payment status. payment_id=%s",
                payment.id
            )
            return

        metadata = session.get('metadata', {}) or {}
        payment_type = metadata.get('payment_type')

        try:
            # =========================================================
            # SERVICE ESCROW
            # =========================================================
            if payment_type == 'SERVICE_ESCROW':

                logger.info(
                    "Processing SERVICE_ESCROW payment. payment_id=%s",
                    payment.id
                )

                self._handle_service_escrow_completed(payment)

                logger.info(
                    "SERVICE_ESCROW processing completed. payment_id=%s",
                    payment.id
                )

                return

            # =========================================================
            # WALLET TOPUP
            # =========================================================
            if payment_type == 'WALLET_TOPUP':

                logger.info(
                    "Processing WALLET_TOPUP. payment_id=%s",
                    payment.id
                )

                with transaction.atomic():

                    wallet, _ = Wallet.objects.get_or_create(
                        user=payment.user
                    )

                    wallet.balance = F('balance') + payment.amount
                    wallet.save()

                    wallet.refresh_from_db()

                    WalletTransaction.objects.create(
                        wallet=wallet,
                        amount=payment.amount,
                        transaction_type='CREDIT',
                        description=(
                            f"Added ₹{payment.amount:.2f} to wallet"
                        )
                    )

                logger.info(
                    "Wallet topup completed successfully. payment_id=%s",
                    payment.id
                )

                return

            # =========================================================
            # PLATFORM FEE
            # =========================================================
            if (
                payment_type == 'PLATFORM_FEE'
                and payment.service_request
            ):

                service_request = payment.service_request

                logger.info(
                    "Processing PLATFORM_FEE payment. "
                    "payment_id=%s service_request_id=%s",
                    payment.id,
                    service_request.id
                )

                service_request.platform_fee_paid = True
                service_request.platform_fee_txn_id = (
                    payment.stripe_checkout_id
                )

                # Credit admin wallet
                admin_user = get_platform_admin()

                if admin_user:
                    try:
                        with transaction.atomic():

                            admin_wallet, _ = (
                                Wallet.objects.get_or_create(
                                    user=admin_user
                                )
                            )

                            admin_wallet.balance = (
                                F('balance') + payment.amount
                            )

                            admin_wallet.save()

                            admin_wallet.refresh_from_db()

                            WalletTransaction.objects.create(
                                wallet=admin_wallet,
                                amount=payment.amount,
                                transaction_type='CREDIT',
                                description=(
                                    "Platform Fee Collected "
                                    f"for Service Request "
                                    f"#{service_request.id}"
                                )
                            )

                        logger.info(
                            "Admin wallet credited successfully"
                        )

                    except Exception:
                        logger.exception(
                            "Failed to credit admin wallet"
                        )

                # Workshop connection handling
                workshop_id = metadata.get('workshop_id')

                if workshop_id:

                    try:
                        workshop = Workshop.objects.get(
                            pk=workshop_id
                        )

                        existing_connection = (
                            WorkshopConnection.objects.filter(
                                service_request=service_request,
                                status__in=[
                                    'REQUESTED',
                                    'ACCEPTED'
                                ]
                            ).exists()
                        )

                        previous_attempts = (
                            WorkshopConnection.objects.filter(
                                service_request=service_request,
                                workshop=workshop
                            ).count()
                        )

                        if (
                            not existing_connection
                            and previous_attempts < 3
                        ):

                            WorkshopConnection.objects.create(
                                service_request=service_request,
                                workshop=workshop,
                                status='REQUESTED'
                            )

                            push_connection_count_to_workshop(
                                workshop.user.id
                            )

                            service_request.status = 'CONNECTING'

                            logger.info(
                                "Workshop connection created. "
                                "service_request_id=%s",
                                service_request.id
                            )

                        else:
                            service_request.status = (
                                'PLATFORM_FEE_PAID'
                            )

                            logger.info(
                                "Workshop connection skipped. "
                                "service_request_id=%s",
                                service_request.id
                            )

                    except Workshop.DoesNotExist:

                        logger.warning(
                            "Workshop not found during webhook "
                            "processing"
                        )

                        service_request.status = (
                            'PLATFORM_FEE_PAID'
                        )

                    except Exception:
                        logger.exception(
                            "Error while processing workshop "
                            "connection"
                        )

                        service_request.status = (
                            'PLATFORM_FEE_PAID'
                        )

                else:
                    service_request.status = (
                        'PLATFORM_FEE_PAID'
                    )

                service_request.save()

                notify_service_flow_update(service_request.id)

                logger.info(
                    "PLATFORM_FEE processing completed. "
                    "service_request_id=%s",
                    service_request.id
                )

            else:

                logger.warning(
                    "Unhandled payment type or missing service request"
                )

        except Exception:
            logger.exception(
                "Unexpected error while handling completed "
                "checkout session"
            )

    def _handle_service_escrow_completed(self, payment):
        try:
            with transaction.atomic():
                service_request = payment.service_request
                execution = service_request.execution

                # Update Execution
                execution.escrow_paid = True
                execution.escrow_txn_id = payment.stripe_checkout_id
                execution.save()

                # Update ServiceRequest status
                service_request.status = 'SERVICE_AMOUNT_PAID'
                service_request.save()

                # Notify users
                notify_service_flow_update(service_request.id)

                logger.info(
                    "Successfully processed SERVICE_ESCROW for payment_id=%s "
                    "service_request_id=%s",
                    payment.id,
                    service_request.id
                )

        except Exception:
            logger.exception(
                "Error processing SERVICE_ESCROW for payment_id=%s",
                payment.id
            )
            raise


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logger.info(
            "Wallet fetch request initiated. user_id=%s",
            request.user.id
        )

        try:
            wallet, created = Wallet.objects.get_or_create(
                user=request.user
            )

            if created:
                logger.info(
                    "New wallet created. user_id=%s",
                    request.user.id
                )

            serializer = WalletSerializer(wallet)

            logger.info(
                "Wallet fetched successfully. user_id=%s",
                request.user.id
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception(
                "Database error while fetching wallet. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Failed to fetch wallet details'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching wallet. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logger.info(
            "Wallet transaction list requested. user_id=%s",
            request.user.id
        )

        try:
            wallet, created = Wallet.objects.get_or_create(
                user=request.user
            )

            if created:
                logger.info(
                    "New wallet created while fetching transactions. "
                    "user_id=%s",
                    request.user.id
                )

            transactions = wallet.transactions.all().order_by(
                '-created_at'
            )

            try:
                page = int(request.GET.get('page', 1))
                page_size = int(
                    request.GET.get('page_size', 20)
                )

                if page <= 0 or page_size <= 0:
                    raise ValueError

            except ValueError:
                logger.warning(
                    "Invalid pagination parameters. user_id=%s",
                    request.user.id
                )

                return Response(
                    {'error': 'Invalid pagination parameters'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            start = (page - 1) * page_size
            end = start + page_size

            paginated_transactions = transactions[start:end]

            serializer = WalletTransactionSerializer(
                paginated_transactions,
                many=True
            )

            total_transactions = transactions.count()

            logger.info(
                "Wallet transactions fetched successfully. "
                "user_id=%s page=%s",
                request.user.id,
                page
            )

            return Response(
                {
                    'transactions': serializer.data,
                    'total': total_transactions,
                    'page': page,
                    'page_size': page_size,
                    'has_more': end < total_transactions
                },
                status=status.HTTP_200_OK
            )

        except DatabaseError:
            logger.exception(
                "Database error while fetching transactions. "
                "user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Failed to fetch transactions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            logger.exception(
                "Unexpected error while fetching wallet "
                "transactions. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AddMoneyCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        logger.info(
            "Wallet topup checkout initiated. user_id=%s",
            request.user.id
        )

        amount = request.data.get('amount')

        if not amount:

            logger.warning(
                "Missing amount in wallet topup request. "
                "user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================================================
        # Validate amount
        # =========================================================
        try:
            amount = float(amount)

            if amount <= 0:

                logger.warning(
                    "Non-positive wallet topup amount. "
                    "user_id=%s amount=%s",
                    request.user.id,
                    amount
                )

                return Response(
                    {
                        'error': (
                            'Amount must be greater than 0'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount > 100000:

                logger.warning(
                    "Wallet topup exceeds maximum limit. "
                    "user_id=%s amount=%s",
                    request.user.id,
                    amount
                )

                return Response(
                    {
                        'error': (
                            'Amount cannot exceed ₹1,00,000'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except (ValueError, TypeError):

            logger.warning(
                "Invalid wallet topup amount format. "
                "user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================================================
        # Create Stripe Checkout Session
        # =========================================================
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
                                'description': (
                                    f'Add ₹{amount:.2f} '
                                    f'to your wallet balance'
                                ),
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=(
                    f'{settings.FRONTEND_URL}/user/wallet'
                    '?add_money_success=true'
                ),
                cancel_url=(
                    f'{settings.FRONTEND_URL}/user/wallet'
                    '?add_money_canceled=true'
                ),
                metadata={
                    'user_id': str(request.user.id),
                    'payment_type': 'WALLET_TOPUP',
                    'amount': str(amount)
                },
            )

            logger.info(
                "Stripe checkout session created for wallet topup. "
                "checkout_session_id=%s",
                checkout_session.id
            )

        except stripe.error.CardError as e:

            logger.exception(
                "Stripe CardError during wallet topup. "
                "user_id=%s",
                request.user.id
            )

            return Response(
                {
                    'error': (
                        e.user_message
                        or 'Card error occurred'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.RateLimitError:

            logger.exception(
                "Stripe rate limit exceeded during wallet topup"
            )

            return Response(
                {
                    'error': (
                        'Too many requests to payment gateway'
                    )
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        except stripe.error.InvalidRequestError as e:

            logger.exception(
                "Invalid Stripe request during wallet topup"
            )

            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        except stripe.error.AuthenticationError:

            logger.exception(
                "Stripe authentication failed during "
                "wallet topup"
            )

            return Response(
                {
                    'error': (
                        'Payment gateway authentication failed'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except stripe.error.APIConnectionError:

            logger.exception(
                "Stripe network communication failed during "
                "wallet topup"
            )

            return Response(
                {
                    'error': (
                        'Network error while contacting '
                        'payment gateway'
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY
            )

        except stripe.error.StripeError:

            logger.exception(
                "Generic Stripe error during wallet topup"
            )

            return Response(
                {'error': 'Payment gateway error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error while creating wallet "
                "checkout session"
            )

            return Response(
                {'error': 'Unexpected payment error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =========================================================
        # Save Payment Record
        # =========================================================
        try:
            Payment.objects.create(
                user=request.user,
                amount=amount,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='WALLET_TOPUP',
                status='PENDING'
            )

            logger.info(
                "Wallet topup payment record created successfully. "
                "checkout_session_id=%s",
                checkout_session.id
            )

        except DatabaseError:

            logger.exception(
                "Database error while saving wallet topup "
                "payment record"
            )

            return Response(
                {'error': 'Failed to save payment record'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error while saving wallet "
                "payment record"
            )

            return Response(
                {'error': 'Unexpected database error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'url': checkout_session.url},
            status=status.HTTP_200_OK
        )

class PayPlatformFeeWithWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        logger.info(
            "Wallet platform fee payment initiated. user_id=%s",
            request.user.id
        )

        service_request_id = request.data.get(
            'service_request_id'
        )

        workshop_id = request.data.get('workshop_id')

        # =========================================================
        # Validate input
        # =========================================================
        if not service_request_id:

            logger.warning(
                "Missing service_request_id in wallet payment "
                "request. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'service_request_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================================================
        # Fetch Service Request
        # =========================================================
        try:
            service_request = ServiceRequest.objects.get(
                id=service_request_id,
                user=request.user
            )

            logger.info(
                "ServiceRequest fetched successfully. "
                "service_request_id=%s",
                service_request.id
            )

        except ServiceRequest.DoesNotExist:

            logger.warning(
                "ServiceRequest not found. "
                "service_request_id=%s user_id=%s",
                service_request_id,
                request.user.id
            )

            return Response(
                {'error': 'Service Request not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        except Exception:

            logger.exception(
                "Unexpected error while fetching "
                "ServiceRequest. service_request_id=%s",
                service_request_id
            )

            return Response(
                {
                    'error': (
                        'Something went wrong while fetching '
                        'service request'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # =========================================================
        # Already paid check
        # =========================================================
        if service_request.platform_fee_paid:

            logger.info(
                "Platform fee already paid. "
                "service_request_id=%s",
                service_request.id
            )

            return Response(
                {'message': 'Platform fee already paid'},
                status=status.HTTP_200_OK
            )

        fee_amount = settings.STRIPE_PLATFORM_FEE_AMOUNT

        # =========================================================
        # Wallet Payment Processing
        # =========================================================
        try:
            with transaction.atomic():

                wallet, created = Wallet.objects.get_or_create(
                    user=request.user
                )

                if created:
                    logger.info(
                        "New wallet created for user_id=%s",
                        request.user.id
                    )

                # Balance check
                if wallet.balance < fee_amount:

                    logger.warning(
                        "Insufficient wallet balance. "
                        "user_id=%s",
                        request.user.id
                    )

                    return Response(
                        {
                            'error': (
                                'Insufficient wallet balance'
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Deduct amount from wallet
                wallet.balance = (
                    F('balance') - fee_amount
                )

                wallet.save()

                wallet.refresh_from_db()

                logger.info(
                    "Wallet debited successfully. user_id=%s",
                    request.user.id
                )

                # Wallet transaction
                txn = WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=fee_amount,
                    transaction_type='DEBIT',
                    description=(
                        "Platform Fee for "
                        f"Service Request "
                        f"#{service_request.id}"
                    )
                )

                logger.info(
                    "Wallet transaction created. txn_id=%s",
                    txn.id
                )

                # Payment record
                Payment.objects.create(
                    user=request.user,
                    service_request=service_request,
                    amount=fee_amount,
                    currency=settings.STRIPE_CURRENCY,
                    stripe_checkout_id=(
                        f"WALLET-PAY-{txn.id}"
                    ),
                    payment_type='PLATFORM_FEE',
                    status='COMPLETED'
                )

                logger.info(
                    "Payment record created successfully. "
                    "service_request_id=%s",
                    service_request.id
                )

                # =================================================
                # Credit admin wallet
                # =================================================
                admin_user = get_platform_admin()

                if admin_user:

                    try:
                        admin_wallet, _ = (
                            Wallet.objects.get_or_create(
                                user=admin_user
                            )
                        )

                        admin_wallet.balance = (
                            F('balance') + fee_amount
                        )

                        admin_wallet.save()

                        admin_wallet.refresh_from_db()

                        WalletTransaction.objects.create(
                            wallet=admin_wallet,
                            amount=fee_amount,
                            transaction_type='CREDIT',
                            description=(
                                "Platform Fee Collected "
                                f"for Service Request "
                                f"#{service_request.id}"
                            )
                        )

                        logger.info(
                            "Admin wallet credited successfully"
                        )

                    except Exception:

                        logger.exception(
                            "Failed to credit admin wallet"
                        )

                # =================================================
                # Update Service Request
                # =================================================
                service_request.platform_fee_paid = True

                if workshop_id:

                    try:
                        workshop = Workshop.objects.get(
                            pk=workshop_id
                        )

                        existing_connection = (
                            WorkshopConnection.objects.filter(
                                service_request=service_request,
                                status__in=[
                                    'REQUESTED',
                                    'ACCEPTED'
                                ]
                            ).exists()
                        )

                        previous_attempts = (
                            WorkshopConnection.objects.filter(
                                service_request=service_request,
                                workshop=workshop
                            ).count()
                        )

                        if (
                            not existing_connection
                            and previous_attempts < 3
                        ):

                            WorkshopConnection.objects.create(
                                service_request=service_request,
                                workshop=workshop,
                                status='REQUESTED'
                            )

                            push_connection_count_to_workshop(
                                workshop.user.id
                            )

                            service_request.status = (
                                'CONNECTING'
                            )

                            logger.info(
                                "Workshop connection created. "
                                "service_request_id=%s",
                                service_request.id
                            )

                        else:

                            service_request.status = (
                                'PLATFORM_FEE_PAID'
                            )

                            logger.info(
                                "Workshop connection skipped. "
                                "service_request_id=%s",
                                service_request.id
                            )

                    except Workshop.DoesNotExist:

                        logger.warning(
                            "Workshop not found. "
                            "workshop_id=%s",
                            workshop_id
                        )

                        service_request.status = (
                            'PLATFORM_FEE_PAID'
                        )

                    except Exception:

                        logger.exception(
                            "Unexpected error while creating "
                            "workshop connection"
                        )

                        service_request.status = (
                            'PLATFORM_FEE_PAID'
                        )

                else:
                    service_request.status = (
                        'PLATFORM_FEE_PAID'
                    )

                service_request.save()

                logger.info(
                    "ServiceRequest updated successfully. "
                    "service_request_id=%s",
                    service_request.id
                )

                notify_service_flow_update(
                    service_request.id
                )

                logger.info(
                    "Service flow update notification sent. "
                    "service_request_id=%s",
                    service_request.id
                )

            return Response(
                {
                    'message': 'Payment successful',
                    'wallet_balance': wallet.balance
                },
                status=status.HTTP_200_OK
            )

        except DatabaseError:

            logger.exception(
                "Database error during wallet platform fee "
                "payment. service_request_id=%s",
                service_request_id
            )

            return Response(
                {
                    'error': (
                        'Database error occurred while '
                        'processing payment'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error during wallet platform "
                "fee payment. service_request_id=%s",
                service_request_id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        

class UserPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logger.info(
            "User payment history requested. user_id=%s",
            request.user.id
        )

        try:
            payments = Payment.objects.filter(
                user=request.user
            ).order_by('-created_at')

            serializer = PaymentHistorySerializer(
                payments,
                many=True
            )

            logger.info(
                "User payment history fetched successfully. "
                "user_id=%s payment_count=%s",
                request.user.id,
                payments.count()
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except DatabaseError:

            logger.exception(
                "Database error while fetching user payment "
                "history. user_id=%s",
                request.user.id
            )

            return Response(
                {
                    'error': (
                        'Failed to fetch payment history'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error while fetching user "
                "payment history. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkshopPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logger.info(
            "Workshop payment history requested. user_id=%s",
            request.user.id
        )

        try:
            escrow_payments = Payment.objects.filter(
                payment_type='SERVICE_ESCROW',
                service_request__execution__workshop__user=(
                    request.user
                )
            ).select_related(
                'service_request'
            ).order_by(
                '-created_at'
            )

            serializer = PaymentHistorySerializer(
                escrow_payments,
                many=True
            )

            logger.info(
                "Workshop payment history fetched "
                "successfully. user_id=%s payment_count=%s",
                request.user.id,
                escrow_payments.count()
            )

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        except DatabaseError:

            logger.exception(
                "Database error while fetching workshop "
                "payment history. user_id=%s",
                request.user.id
            )

            return Response(
                {
                    'error': (
                        'Failed to fetch workshop payment '
                        'history'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error while fetching workshop "
                "payment history. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MechanicWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        logger.info(
            "Mechanic wallet details requested. user_id=%s",
            request.user.id
        )

        # Mechanic profile validation

        if not hasattr(request.user, 'mechanic'):

            logger.warning(
                "Mechanic profile missing for user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Mechanic profile not found'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            try:
                mechanic = request.user.mechanic

            except Mechanic.DoesNotExist:

                logger.warning(
                    "Mechanic profile does not exist. "
                    "user_id=%s",
                    request.user.id
                )

                return Response(
                    {'error': 'Mechanic profile not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Wallet

            wallet, created = Wallet.objects.get_or_create(
                user=request.user
            )

            if created:
                logger.info(
                    "New mechanic wallet created. user_id=%s",
                    request.user.id
                )


            # Earnings Queryset

            earning_qs = MechanicEarning.objects.filter(
                mechanic=mechanic
            )

            total_earned = (
                earning_qs.aggregate(
                    total=Sum('amount')
                )['total']
                or Decimal('0.00')
            )

            total_bonuses = (
                earning_qs.filter(
                    earning_type='BONUS'
                ).aggregate(
                    total=Sum('amount')
                )['total']
                or Decimal('0.00')
            )

            total_services = (
                earning_qs.filter(
                    earning_type='SERVICE_SHARE'
                ).values(
                    'service_execution'
                ).distinct().count()
            )

            now = timezone.now()

            this_month = (
                earning_qs.filter(
                    created_at__year=now.year,
                    created_at__month=now.month
                ).aggregate(
                    total=Sum('amount')
                )['total']
                or Decimal('0.00')
            )

            try:
                page = int(
                    request.GET.get('page', 1)
                )

                page_size = int(
                    request.GET.get('page_size', 20)
                )

                if page <= 0 or page_size <= 0:
                    raise ValueError

            except ValueError:

                logger.warning(
                    "Invalid pagination params in mechanic "
                    "wallet request. user_id=%s",
                    request.user.id
                )

                return Response(
                    {
                        'error': (
                            'Invalid pagination parameters'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            start = (page - 1) * page_size
            end = start + page_size

            earning_list = (
                earning_qs.select_related(
                    'service_execution__service_request'
                ).order_by(
                    '-created_at'
                )[start:end]
            )

            earning_data = []

            for e in earning_list:

                se = e.service_execution
                sr = se.service_request if se else None

                mechanic_count = (
                    se.mechanics.count()
                    if se else 0
                )

                earning_data.append({
                    'id': e.id,
                    'earning_type': e.earning_type,
                    'amount': str(e.amount),
                    'description': e.description,
                    'created_at': e.created_at,

                    'service_execution': {
                        'id': se.id,
                        'mechanic_count': mechanic_count,

                        'service_request': {
                            'id': sr.id,
                            'issue_category': (
                                sr.issue_category
                            ),
                            'vehicle_model': (
                                sr.vehicle_model
                            )
                        } if sr else None

                    } if se else None
                })

            logger.info(
                "Mechanic wallet details fetched "
                "successfully. user_id=%s",
                request.user.id
            )

            total_earnings = earning_qs.count()

            return Response(
                {
                    'balance': str(wallet.balance),
                    'total_earned': str(total_earned),
                    'this_month': str(this_month),
                    'total_bonuses': str(total_bonuses),
                    'total_services': total_services,
                    'earnings': earning_data,
                    'total': total_earnings,
                    'page': page,
                    'page_size': page_size,
                    'has_more': end < total_earnings
                },
                status=status.HTTP_200_OK
            )

        except DatabaseError:

            logger.exception(
                "Database error while loading mechanic "
                "wallet details. user_id=%s",
                request.user.id
            )

            return Response(
                {
                    'error': (
                        'Failed to load mechanic wallet '
                        'details'
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:

            logger.exception(
                "Unexpected error while loading mechanic "
                "wallet details. user_id=%s",
                request.user.id
            )

            return Response(
                {'error': 'Unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )