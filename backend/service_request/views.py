from rest_framework import status, generics
from django.utils import timezone
from rest_framework.response import Response
from .models import ServiceRequest
from accounts.models import Workshop
from .serializers import ServiceRequestSerializer, NearbyWorkshopSerializer, WorkshopRequestActionSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from math import radians, cos, sin, asin, sqrt


def calculate_distance(lat1, long1, lat2, long2):
    if lat2 == None or long2 == None:
        return float('inf')
    R = 6371
    dlat = radians(lat2 - lat1)
    dlong = radians(long2 - long1)
    a = sin(dlat/2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlong/2)**2
    c = 2 * asin(sqrt(a))

    return R * c

class UserServiceRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        # Check and update expired requests
        expired_requests = ServiceRequest.objects.filter(
            user=self.request.user,
            status__in=['CREATED', 'REQUESTED'],
            expires_at__lt=timezone.now()
        )
        if expired_requests.exists():
            expired_requests.update(status='EXPIRED')
            
        return ServiceRequest.objects.filter(user=self.request.user).order_by('-created_at')

class CreateServiceRequestView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer

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
        ws_serializer = NearbyWorkshopSerializer(nearby_list, many=True)
        
        return Response({
            "request": req_serializer.data,
            "nearby_workshops": ws_serializer.data
        })

class ConnectWorkshopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            service_request = ServiceRequest.objects.get(pk=pk, user=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        workshop_id = request.data.get('workshop_id')
        if not workshop_id:
            return Response({"error": "Workshop ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            workshop = Workshop.objects.get(id=workshop_id)
        except Workshop.DoesNotExist:
            return Response({"error": "Workshop not found"}, status=status.HTTP_404_NOT_FOUND)
        
        service_request.workshop = workshop
        service_request.status = 'REQUESTED'
        service_request.save()
        
        return Response(ServiceRequestSerializer(service_request).data)

class WorkshopRequestListView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Assuming the logged in user has a workshop profile
        if hasattr(self.request.user, 'workshop'):
            return ServiceRequest.objects.filter(workshop=self.request.user.workshop).order_by('-created_at')
        return ServiceRequest.objects.none()

class UpdateServiceRequestStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            # Verify the user is the workshop owner of the request
            if not hasattr(request.user, 'workshop'):
                return Response({"error": "User is not a workshop"}, status=status.HTTP_403_FORBIDDEN)
                
            service_request = ServiceRequest.objects.get(pk=pk, workshop=request.user.workshop)
        except ServiceRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = WorkshopRequestActionSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            service_request.status = new_status
            service_request.save()
            return Response(ServiceRequestSerializer(service_request).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
