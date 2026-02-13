import stripe
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from .models import Payment, Wallet, WalletTransaction
from .serializers import WalletSerializer, WalletTransactionSerializer
from service_request.models import ServiceRequest, ServiceExecution, Estimate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django.db.models import F
from django.db import transaction

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        service_request_id = request.data.get('service_request_id')
        if not service_request_id:
            return Response({'error': 'service_request_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service_request = ServiceRequest.objects.get(id=service_request_id, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service Request not found'}, status=status.HTTP_404_NOT_FOUND)

        if service_request.platform_fee_paid:
             return Response({'message': 'Platform fee already paid'}, status=status.HTTP_200_OK)

        
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': settings.STRIPE_CURRENCY,
                            'unit_amount': int(settings.STRIPE_PLATFORM_FEE_AMOUNT * 100),
                            'product_data': {
                                'name': 'Platform Fee', 
                                'description': f'Platform fee for service request #{service_request.id}',
                            },
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=f'http://localhost:5173/user/workshops-nearby/{service_request.id}?payment_success=true',
                cancel_url=f'http://localhost:5173/user/workshops-nearby/{service_request.id}?payment_canceled=true',
                metadata={
                    'service_request_id': service_request.id,
                    'user_id': request.user.id,
                    'payment_type': 'PLATFORM_FEE'
                },
            )
            
            Payment.objects.create(
                user=request.user,
                service_request=service_request,
                amount=settings.STRIPE_PLATFORM_FEE_AMOUNT,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='PLATFORM_FEE',
                status='PENDING'
            )

            return Response({'url': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateServiceEscrowCheckoutView(APIView):
    """Create Stripe Checkout for approved estimate (escrow). Money held until OTP verification."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        estimate_id = request.data.get('estimate_id')
        if not estimate_id:
            return Response({'error': 'estimate_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            estimate = Estimate.objects.get(pk=estimate_id)
        except Estimate.DoesNotExist:
            return Response({'error': 'Estimate not found'}, status=status.HTTP_404_NOT_FOUND)
        if estimate.service_request.user != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if estimate.status != 'APPROVED':
            return Response({'error': 'Only approved estimates can be paid'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            execution = estimate.service_request.execution
        except ServiceExecution.DoesNotExist:
            return Response({'error': 'Service execution not found'}, status=status.HTTP_400_BAD_REQUEST)
        if execution.escrow_paid:
            return Response({'error': 'Service amount already paid'}, status=status.HTTP_400_BAD_REQUEST)
        amount = float(estimate.total_amount)
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        sr_id = estimate.service_request.id
        base_url = 'http://localhost:5173'
        success_url = f'{base_url}/user/service-flow/{sr_id}?escrow_success=true'
        cancel_url = f'{base_url}/user/service-flow/{sr_id}?escrow_canceled=true'
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': settings.STRIPE_CURRENCY,
                        'unit_amount': int(round(amount * 100)),
                        'product_data': {
                            'name': 'Service Amount (Escrow)',
                            'description': f'Service request #{sr_id} – amount held until completion',
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'payment_type': 'SERVICE_ESCROW',
                    'service_request_id': sr_id,
                    'estimate_id': str(estimate_id),
                    'user_id': str(request.user.id),
                },
            )
            Payment.objects.create(
                user=request.user,
                service_request=estimate.service_request,
                amount=estimate.total_amount,
                currency=settings.STRIPE_CURRENCY,
                stripe_checkout_id=checkout_session.id,
                payment_type='SERVICE_ESCROW',
                status='PENDING',
            )
            return Response({'url': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            print(f"Processing checkout.session.completed for session: {session['id']}")
            self.handle_checkout_session_completed(session)
        else:
            print(f"Webhook event type '{event['type']}' not handled")

        return HttpResponse(status=200)

    def handle_checkout_session_completed(self, session):
        print(f"handle_checkout_session_completed called with session ID: {session['id']}")
        
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
                    description=f"Added ${payment.amount:.2f} to wallet"
                )
            print(f"Wallet balance updated (Atomic)")
            return

        if payment_type == 'PLATFORM_FEE' and payment.service_request:
            print(f"Updating ServiceRequest {payment.service_request.id}")
            print(f"Before - platform_fee_paid: {payment.service_request.platform_fee_paid}, status: {payment.service_request.status}")
            payment.service_request.platform_fee_paid = True
            payment.service_request.platform_fee_txn_id = payment.stripe_checkout_id
            payment.service_request.status = 'CONNECTING' 
            payment.service_request.save()
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
        print("SERVICE_ESCROW: execution updated, service request status = SERVICE_AMOUNT_PAID")


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)


class WalletTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
        })


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
            if amount > 10000:  
                return Response({'error': 'Amount cannot exceed $10,000'}, status=status.HTTP_400_BAD_REQUEST)
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
                                'description': f'Add ${amount:.2f} to your wallet balance',
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

                # Update Service Request
                service_request.platform_fee_paid = True
                service_request.status = 'CONNECTING'
                service_request.save()

            return Response({'message': 'Payment successful', 'wallet_balance': wallet.balance}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
