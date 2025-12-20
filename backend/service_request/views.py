from rest_framework import status, generics
from rest_framework.response import Response
from .models import ServiceRequest
from accounts.models import Workshop
from .serializers import ServiceRequestSerializer, NearbyWorkshopSerializer
from math import radians, cos, sin, asin, sqrt


def calculate_distance(lat1, long1, lat2, long2):
    if lat2 == None or long2 == None:
        return float('inf')
    R = 6371
    dlat = radians(lat2 - lat2)
    dlong = radians(long2 - long1)
    a = sin(dlat/2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlong/2)**2
    c = 2 * asin(sqrt(a))

    return R * c

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

