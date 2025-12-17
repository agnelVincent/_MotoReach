from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from accounts.models import Workshop,User,Mechanic

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        user_count = User.objects.filter(role = 'user').count()
        workshop_count = Workshop.objects.count()
        mechanic_count = Mechanic.objects.count()

        recent_signups = User.objects.all().order_by('-date_joined')[:5]

        signups_data = [
            {
                'full_name' : u.full_name,
                'email' : u.email,
                'role' : u.role,
                'time' : u.date_joined
            } for u in recent_signups
        ]

        pending_workshops = Workshop.objects.filter(verification_status = 'PENDING')
        pending_data = [
            {
                'id' : w.id,
                'name' : w.workshop_name,
                'location' : f'{w.city}, {w.state}',
                'requestedOn' : w.created_at,
                'status' : 'Pending'
            } for w in pending_workshops
        ]

        return Response(
            {
                'metrics' : {
                    'total_users' : user_count,
                    'total_workshops' : workshop_count,
                    'total_mechanics' : mechanic_count
                },
                'recent_signups' : signups_data,
                'pending_approvals' : pending_data
            }
        )
    
