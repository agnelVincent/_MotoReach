from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import serializers
from accounts.models import Workshop,User,Mechanic
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

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        user_count = User.objects.filter(role = 'user').count()
        workshop_count = Workshop.objects.count()
        mechanic_count = Mechanic.objects.count()

        recent_signups = User.objects.all().order_by('-date_joined')[:5]

        total_requests = ServiceRequest.objects.all().count()

        wallet = Wallet.objects.get(user = request.user)

        signups_data = [
            {
                'full_name' : u.full_name,
                'email' : u.email,
                'role' : u.role,
                'time' : u.date_joined
            } for u in recent_signups
        ]

        pending_workshops = Workshop.objects.filter(Q(verification_status = 'PENDING') | Q(verification_status='REQUESTED_AGAIN'))
        pending_data = [
            {
                'id' : w.id,
                'name' : w.workshop_name,
                'location' : f'{w.city}, {w.state}',
                'requestedOn' : w.created_at,
                'status' : w.get_verification_status_display()
            } for w in pending_workshops
        ]

        monthly_data = []

        now = timezone.now()

        if wallet:
            for i in range(5,-1,-1):
                target_date = now - relativedelta(months=i)
                qs = WalletTransaction.objects.filter(wallet = wallet, 
                                                           transaction_type='CREDIT',
                                                           created_at__year = target_date.year, 
                                                           created_at__month = target_date.month)
                

                revenue = qs.aggregate(total = Sum('amount'))['total']

                monthly_data.append({
                    'month' : target_date.strftime('%b'),
                    'revenue' : float(revenue) if revenue else 0
                })
        
        else:
            for i in range(5,-1,-1):
                target_date = now - relativedelta(months=i)
                monthly_data.append({
                    'month' : target_date.strftime('%b'),
                    'revenue' : 0
                })

        complaints = Complaint.objects.order_by('-created_at')[:5]
        complaints = ComplaintSerializer(complaints,many = True)
        print(complaints.data)

        return Response(
            {
                'metrics' : {
                    'total_users' : user_count,
                    'total_workshops' : workshop_count,
                    'total_mechanics' : mechanic_count
                },
                'recent_signups' : signups_data,
                'pending_approvals' : pending_data,
                'total_requests' : total_requests,
                'total_revenue' : wallet.balance,
                'monthly_data' : monthly_data,
                'complaints' : complaints.data

            }, status=status.HTTP_200_OK
        )
    
class WorkshopVerificationView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, workshop_id):

        workshop = get_object_or_404(Workshop, id=workshop_id)
        action = request.data.get('action')
        if action == 'approve':
            workshop.rejection_reason = None
            workshop.verification_status = 'APPROVED'
        elif action == 'reject':
            reason = request.data.get('reason')
            workshop.rejection_reason = reason
            workshop.verification_status = 'REJECTED'
        else:
            return Response({'error' : 'Invalid action'},status=status.HTTP_400_BAD_REQUEST)
        
        workshop.save()

        return Response(
            {
                'message' : f'workshop {action}ed successfully',
                'workshop_id' : workshop_id,
                'status' : workshop.get_verification_status_display(),
                "rejection_reason": workshop.rejection_reason
            },
            status=status.HTTP_200_OK
        )

class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
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
        return Response(data, status=status.HTTP_200_OK)

class AdminWorkshopListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
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
        return Response(data, status=status.HTTP_200_OK)

class AdminWorkshopDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, workshop_id):
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
        return Response(data, status=status.HTTP_200_OK)

class AdminMechanicListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
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
        return Response(data, status=status.HTTP_200_OK)

class ToggleUserBlockView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        if user.is_superuser:
             return Response({'error': 'Cannot block superuser'}, status=status.HTTP_403_FORBIDDEN)
             
        user.is_active = not user.is_active
        user.save()
        
        status_text = 'Active' if user.is_active else 'Blocked'
        return Response({
            'message': f'User {status_text}', 
            'isBlocked': not user.is_active,
            'status': status_text,
            'userId': user.id
        }, status=status.HTTP_200_OK)


class AdminComplaintListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        complaints = Complaint.objects.select_related(
            'reporter', 'reported_user', 'service_request', 'service_request__execution'
        ).order_by('-created_at')
        serializer = AdminComplaintSerializer(complaints, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
