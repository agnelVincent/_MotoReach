from rest_framework import status, generics, permissions, parsers
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ServiceRequest, WorkshopConnection
from accounts.models import Workshop
from .serializers import ServiceRequestSerializer, NearbyWorkshopSerializer, WorkshopConnectionSerializer
from django.utils import timezone
from datetime import timedelta
from math import radians, cos, sin, asin, sqrt
from .utils import check_request_expiration


def calculate_distance(lat1, long1, lat2, long2):
    if lat2 == None or long2 == None:
        return float('inf')
    R = 6371
    dlat = radians(lat2 - lat2)
    dlong = radians(long2 - long1)
    a = sin(dlat/2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlong/2)**2
    c = 2 * asin(sqrt(a))

    return R * c

def check_expired_connections(queryset):
    expiration_threshold = timezone.now() - timedelta(hours=1) 
    
    expired_requests = queryset.filter(
        status='REQUESTED', 
        requested_at__lt=expiration_threshold
    )
    
    updated_count = 0
    for conn in expired_requests:
        conn.status = 'AUTO_REJECTED'
        conn.responded_at = timezone.now()
        conn.save()

        if conn.service_request.status == 'CONNECTING':
            conn.service_request.status = 'PLATFORM_FEE_PAID'
            conn.service_request.save()
        updated_count += 1
    
    return updated_count

class CreateServiceRequestView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

    def create(self, request , *args, **kwargs):
        serializer = self.get_serializer(data = request.data)
        serializer.is_valid(raise_exception = True)

        self.perform_create(serializer)

        u_lat = serializer.data['user_latitude']
        u_long = serializer.data['user_longitude']

        workshops = Workshop.objects.filter(verification_status = 'APPROVED')
        nearby_list = []

        for ws in workshops:
            dist = calculate_distance(u_lat,u_long, ws.latitude, ws.longitude)
            if dist <= 20:
                ws.distance = round(dist, 2)
                nearby_list.append(ws)

        nearby_list.sort(key=lambda x : x.distance)
        print(nearby_list)
        nearby_serializer = NearbyWorkshopSerializer(nearby_list, many = True)
    
        return Response({
            'request' : serializer.data,
            'nearby_workshops' : nearby_serializer.data
        }, status=status.HTTP_201_CREATED)

    

class ServiceRequestDetailView(generics.RetrieveAPIView):
    serializer_class = ServiceRequestSerializer
    queryset = ServiceRequest.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        check_request_expiration(instance)
        instance.refresh_from_db()

        u_lat = instance.user_latitude
        u_lon = instance.user_longitude
        
        workshops = Workshop.objects.filter(
            verification_status='APPROVED'
        ).exclude(latitude__isnull=True)
        
        nearby_list = []
        for ws in workshops:
            dist = calculate_distance(u_lat, u_lon, ws.latitude, ws.longitude)
            if dist <= 20:
                ws.distance = round(dist, 2)
                nearby_list.append(ws)
        
        nearby_list.sort(key=lambda x: x.distance)
        
        req_serializer = self.get_serializer(instance)
        
        active_connection = WorkshopConnection.objects.filter(
            service_request=instance
        ).exclude(status__in=['REJECTED', 'AUTO_REJECTED', 'CANCELLED', 'WITHDRAWN']).first()
        
        connection_data = None
        if active_connection:
            connection_data = WorkshopConnectionSerializer(active_connection).data
            
        ws_serializer = NearbyWorkshopSerializer(nearby_list, many=True)
        
        return Response({
            "request": req_serializer.data,
            "nearby_workshops": ws_serializer.data,
            "active_connection": connection_data
        })


class UserServiceRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = ServiceRequest.objects.filter(user=self.request.user).order_by('-created_at')
        
        user_connections = WorkshopConnection.objects.filter(
            service_request__in=qs,
            status='REQUESTED'
        )
        check_expired_connections(user_connections)
        
        for req in qs:
            check_request_expiration(req)
            
        qs = ServiceRequest.objects.filter(user=self.request.user).order_by('-created_at')

        return qs

class ConnectWorkshopView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        workshop_id = request.data.get('workshop_id')
        try:
            workshop = Workshop.objects.get(pk=workshop_id)
        except Workshop.DoesNotExist:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        if not service_request.platform_fee_paid:
             return Response({"error": "Platform fee not paid"}, status=status.HTTP_400_BAD_REQUEST)
        
        if service_request.status == 'EXPIRED':
             return Response({"error": "This service request has expired."}, status=status.HTTP_400_BAD_REQUEST)
        
        existing_connection = WorkshopConnection.objects.filter(
            service_request=service_request, 
            status__in=['REQUESTED', 'ACCEPTED']
        ).exists()

        if existing_connection:
            return Response({"error": "You already have an active connection request for this service."}, status=status.HTTP_400_BAD_REQUEST)
        
        previous_attempts = WorkshopConnection.objects.filter(
            service_request=service_request,
            workshop=workshop
        ).count()

        if previous_attempts >= 3:
            return Response({"error": "You have reached the maximum limit of 3 connection attempts for this workshop."}, status=status.HTTP_400_BAD_REQUEST)
        
        WorkshopConnection.objects.create(
            service_request=service_request,
            workshop=workshop,
            status='REQUESTED'
        )
        
        service_request.status = 'CONNECTING'
        service_request.save()

        return Response({"message": "Connection requested successfully"}, status=status.HTTP_201_CREATED)


class WorkshopConnectionRequestsView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can access this"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)
        
        check_expired_connections(WorkshopConnection.objects.filter(workshop=workshop))

        connections = WorkshopConnection.objects.filter(workshop=workshop).order_by('-requested_at')
        serializer = WorkshopConnectionSerializer(connections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can accept requests"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
        except WorkshopConnection.DoesNotExist:
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

        if connection.status != 'REQUESTED':
            return Response({"error": f"Connection request is already {connection.status}"}, status=status.HTTP_400_BAD_REQUEST)

        connection.status = 'ACCEPTED'
        connection.responded_at = timezone.now()
        connection.save()

        connection.service_request.status = 'CONNECTED'
        connection.service_request.save()

        return Response({"message": "Connection request accepted successfully"}, status=status.HTTP_200_OK)


class RejectConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can reject requests"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
        except WorkshopConnection.DoesNotExist:
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

        if connection.status != 'REQUESTED':
            return Response({"error": f"Connection request is already {connection.status}"}, status=status.HTTP_400_BAD_REQUEST)

        connection.status = 'REJECTED'
        connection.responded_at = timezone.now()
        connection.save()

        connection.service_request.status = 'PLATFORM_FEE_PAID'
        connection.service_request.save()

        return Response({"message": "Connection request rejected successfully"}, status=status.HTTP_200_OK)


class CancelConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'workshop_admin':
            return Response({"error": "Only workshop admins can cancel connections"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            workshop = request.user.workshop
        except AttributeError:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            connection = WorkshopConnection.objects.get(pk=pk, workshop=workshop)
        except WorkshopConnection.DoesNotExist:
            return Response({"error": "Connection request not found"}, status=status.HTTP_404_NOT_FOUND)

        if connection.status != 'ACCEPTED':
            return Response({"error": "Only accepted connections can be cancelled"}, status=status.HTTP_400_BAD_REQUEST)

        connection.status = 'CANCELLED'
        connection.cancelled_by = 'WORKSHOP'
        connection.responded_at = timezone.now()
        connection.save()
        
        connection.service_request.status = 'PLATFORM_FEE_PAID'
        connection.service_request.save()

        return Response({"message": "Connection cancelled successfully"}, status=status.HTTP_200_OK)

class UserCancelConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            connection = WorkshopConnection.objects.filter(
                service_request_id=pk, 
                service_request__user=request.user,
                status__in=['REQUESTED', 'ACCEPTED']
            ).first()
            
            if not connection:

                return Response({"error": "No active connection found to cancel"}, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
             
        if connection.status == 'REQUESTED':
            connection.status = 'WITHDRAWN'
            connection.cancelled_by = 'USER'
        else:
             connection.status = 'CANCELLED'
             connection.cancelled_by = 'USER'

        connection.responded_at = timezone.now()
        connection.save()
        
        connection.service_request.status = 'PLATFORM_FEE_PAID'
        connection.service_request.save()
        
        return Response({"message": "Connection cancelled"}, status=status.HTTP_200_OK)
        
class DeleteServiceRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)

        if service_request.platform_fee_paid:
            return Response({"error": "Cannot delete request because platform fee is already paid."}, status=status.HTTP_400_BAD_REQUEST)
        
        if service_request.status not in ['CREATED', 'CANCELLED', 'EXPIRED']:
            return Response({"error": "Cannot delete active or processed service request."}, status=status.HTTP_400_BAD_REQUEST)

        active_connections = WorkshopConnection.objects.filter(
            service_request=service_request,
            status__in=['REQUESTED', 'ACCEPTED']
        ).exists()
        
        if active_connections:
             return Response({"error": "Cannot delete request with ongoing connections."}, status=status.HTTP_400_BAD_REQUEST)

        service_request.delete()
        return Response({"message": "Service request deleted successfully"}, status=status.HTTP_200_OK)
