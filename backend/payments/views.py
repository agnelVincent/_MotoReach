import stripe
from django.conf import settings
from django.shortcuts import redirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from service_request.models import ServiceRequest
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse

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
        
        # Retrieve payment
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

        # Update Service Request
        if payment.service_request:
            print(f"Updating ServiceRequest {payment.service_request.id}")
            print(f"Before - platform_fee_paid: {payment.service_request.platform_fee_paid}, status: {payment.service_request.status}")
            payment.service_request.platform_fee_paid = True
            payment.service_request.platform_fee_txn_id = payment.stripe_checkout_id
            payment.service_request.status = 'CONNECTING' 
            payment.service_request.save()
            print(f"After - platform_fee_paid: {payment.service_request.platform_fee_paid}, status: {payment.service_request.status}")
            print("ServiceRequest updated successfully!")
        else:
            print("WARNING: Payment has no associated service_request")
        
        print("=" * 50)
