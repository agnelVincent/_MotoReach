import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import serializers
from accounts.models import Workshop, User, Mechanic
from admin_panel.models import Complaint
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from service_request.models import ServiceRequest
from payments.models import Wallet, WalletTransaction
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from django.db.models import Sum
from .models import Complaint
from .serializers import ComplaintSerializer, AdminComplaintSerializer

logger = logging.getLogger(__name__)


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info("Admin dashboard stats requested by user: %s", request.user)
        try:
            user_count = User.objects.filter(role='user').count()
            workshop_count = Workshop.objects.count()
            mechanic_count = Mechanic.objects.count()

            recent_signups = User.objects.all().order_by('-date_joined')[:5]

            total_requests = ServiceRequest.objects.all().count()

            try:
                wallet = Wallet.objects.get(user=request.user)
            except Wallet.DoesNotExist:
                logger.warning("No wallet found for admin user: %s", request.user)
                wallet = None
            except Wallet.MultipleObjectsReturned:
                logger.warning("Multiple wallets found for admin user: %s — using first", request.user)
                wallet = Wallet.objects.filter(user=request.user).first()

            signups_data = [
                {
                    'full_name': u.full_name,
                    'email': u.email,
                    'role': u.role,
                    'time': u.date_joined
                } for u in recent_signups
            ]

            pending_workshops = Workshop.objects.filter(
                Q(verification_status='PENDING') | Q(verification_status='REQUESTED_AGAIN')
            )
            pending_data = [
                {
                    'id': w.id,
                    'name': w.workshop_name,
                    'location': f'{w.city}, {w.state}',
                    'requestedOn': w.created_at,
                    'status': w.get_verification_status_display()
                } for w in pending_workshops
            ]

            monthly_data = []
            now = timezone.now()

            if wallet:
                for i in range(5, -1, -1):
                    target_date = now - relativedelta(months=i)
                    qs = WalletTransaction.objects.filter(
                        wallet=wallet,
                        transaction_type='CREDIT',
                        created_at__year=target_date.year,
                        created_at__month=target_date.month
                    )
                    revenue = qs.aggregate(total=Sum('amount'))['total']
                    monthly_data.append({
                        'month': target_date.strftime('%b'),
                        'revenue': float(revenue) if revenue else 0
                    })
            else:
                for i in range(5, -1, -1):
                    target_date = now - relativedelta(months=i)
                    monthly_data.append({
                        'month': target_date.strftime('%b'),
                        'revenue': 0
                    })

            complaints = Complaint.objects.order_by('-created_at')[:5]
            complaints_serializer = ComplaintSerializer(complaints, many=True)

            logger.info(
                "Dashboard stats fetched — users: %d, workshops: %d, mechanics: %d, requests: %d",
                user_count, workshop_count, mechanic_count, total_requests
            )
            return Response(
                {
                    'metrics': {
                        'total_users': user_count,
                        'total_workshops': workshop_count,
                        'total_mechanics': mechanic_count
                    },
                    'recent_signups': signups_data,
                    'pending_approvals': pending_data,
                    'total_requests': total_requests,
                    'total_revenue': wallet.balance if wallet else 0,
                    'monthly_data': monthly_data,
                    'complaints': complaints_serializer.data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error("Failed to fetch dashboard stats for user %s", request.user, exc_info=True)
            return Response(
                {'error': 'Failed to fetch dashboard stats', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkshopVerificationView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, workshop_id):
        logger.info("Workshop verification action requested — workshop_id: %s, admin: %s", workshop_id, request.user)
        try:
            workshop = get_object_or_404(Workshop, id=workshop_id)
            action = request.data.get('action')

            if action == 'approve':
                workshop.rejection_reason = None
                workshop.verification_status = 'APPROVED'
                logger.info("Workshop approved — id: %s, by admin: %s", workshop_id, request.user)
            elif action == 'reject':
                reason = request.data.get('reason', '').strip()
                if not reason:
                    logger.warning("Rejection attempted without reason — workshop_id: %s, admin: %s", workshop_id, request.user)
                    return Response(
                        {'error': 'A rejection reason is required'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                workshop.rejection_reason = reason
                workshop.verification_status = 'REJECTED'
                logger.info("Workshop rejected — id: %s, reason: '%s', by admin: %s", workshop_id, reason, request.user)
            else:
                logger.warning("Invalid verification action '%s' — workshop_id: %s, admin: %s", action, workshop_id, request.user)
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

            workshop.save()

            return Response(
                {
                    'message': f'Workshop {action}ed successfully',
                    'workshop_id': workshop_id,
                    'status': workshop.get_verification_status_display(),
                    'rejection_reason': workshop.rejection_reason
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error("Failed to update verification for workshop_id %s", workshop_id, exc_info=True)
            return Response(
                {'error': 'Failed to update workshop verification', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info("Admin user list requested by: %s", request.user)
        try:
            users = User.objects.filter(role='user').order_by('-date_joined')
            data = [
                {
                    'id': user.id,
                    'fullName': user.full_name,
                    'email': user.email,
                    'status': 'Active' if user.is_active else 'Blocked',
                    'isActive': user.is_active
                } for user in users
            ]
            logger.info("Fetched %d users", len(data))
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch user list", exc_info=True)
            return Response(
                {'error': 'Failed to fetch users', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminWorkshopListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info("Admin workshop list requested by: %s", request.user)
        try:
            workshops = Workshop.objects.select_related('user').all().order_by('-created_at')
            data = []
            for workshop in workshops:
                data.append({
                    'id': workshop.id,
                    'workshopName': workshop.workshop_name,
                    'ownerName': workshop.user.full_name,
                    'email': workshop.user.email,
                    'verificationStatus': workshop.get_verification_status_display(),
                    'isBlocked': not workshop.user.is_active,
                    'userId': workshop.user.id
                })
            logger.info("Fetched %d workshops", len(data))
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch workshop list", exc_info=True)
            return Response(
                {'error': 'Failed to fetch workshops', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminWorkshopDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, workshop_id):
        logger.info("Admin workshop detail requested — workshop_id: %s, by: %s", workshop_id, request.user)
        try:
            workshop = get_object_or_404(Workshop.objects.select_related('user'), id=workshop_id)
            data = {
                'id': workshop.id,
                'workshopName': workshop.workshop_name,
                'ownerName': workshop.user.full_name,
                'email': workshop.user.email,
                'contactNumber': workshop.contact_number,
                'licenseNumber': workshop.license_number,
                'type': workshop.get_type_display(),
                'addressLine': workshop.address_line,
                'locality': workshop.locality,
                'city': workshop.city,
                'state': workshop.state,
                'pincode': workshop.pincode,
                'latitude': workshop.latitude,
                'longitude': workshop.longitude,
                'verificationStatus': workshop.get_verification_status_display(),
                'rejectionReason': workshop.rejection_reason,
                'createdAt': workshop.created_at,
                'isBlocked': not workshop.user.is_active,
                'userId': workshop.user.id
            }
            logger.info("Workshop detail fetched — id: %s, name: '%s'", workshop.id, workshop.workshop_name)
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch details for workshop_id %s", workshop_id, exc_info=True)
            return Response(
                {'error': 'Failed to fetch workshop details', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminMechanicListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info("Admin mechanic list requested by: %s", request.user)
        try:
            mechanics = Mechanic.objects.select_related('user', 'workshop').all().order_by('-created_at')
            data = []
            for mechanic in mechanics:
                workshop_name = mechanic.workshop.workshop_name if mechanic.workshop else None
                workshops_list = [workshop_name] if workshop_name else []

                data.append({
                    'id': mechanic.id,
                    'fullName': mechanic.user.full_name,
                    'email': mechanic.user.email,
                    'workshops': workshops_list,
                    'availability': mechanic.get_availability_display(),
                    'isBlocked': not mechanic.user.is_active,
                    'userId': mechanic.user.id
                })
            logger.info("Fetched %d mechanics", len(data))
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch mechanic list", exc_info=True)
            return Response(
                {'error': 'Failed to fetch mechanics', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ToggleUserBlockView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        logger.info("Toggle block requested — user_id: %s, by admin: %s", user_id, request.user)
        try:
            user = get_object_or_404(User, id=user_id)
            if user.is_superuser:
                logger.warning("Attempted to block superuser — user_id: %s, by admin: %s", user_id, request.user)
                return Response({'error': 'Cannot block superuser'}, status=status.HTTP_403_FORBIDDEN)

            user.is_active = not user.is_active
            user.save()

            status_text = 'Active' if user.is_active else 'Blocked'
            logger.info("User %s toggled to '%s' by admin: %s", user_id, status_text, request.user)
            return Response({
                'message': f'User {status_text}',
                'isBlocked': not user.is_active,
                'status': status_text,
                'userId': user.id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to toggle block status for user_id %s", user_id, exc_info=True)
            return Response(
                {'error': 'Failed to toggle user block status', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminComplaintListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logger.info("Admin complaint list requested by: %s", request.user)
        try:
            complaints = Complaint.objects.select_related(
                'reporter', 'reported_user', 'service_request', 'service_request__execution'
            ).order_by('-created_at')
            serializer = AdminComplaintSerializer(complaints, many=True)
            logger.info("Fetched %d complaints", complaints.count())
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error("Failed to fetch complaint list", exc_info=True)
            return Response(
                {'error': 'Failed to fetch complaints', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
