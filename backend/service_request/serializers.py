from rest_framework import serializers
from .models import ServiceRequest
from accounts.models import Workshop
from math import radians, cos, sin, asin, sqrt

class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'vehicle_type', 'vehicle_model', 'issue_category', 'description', 'image_urls', 'user_latitude', 'user_longitude'
        ]

        read_only_fields = ['id']

class NearbyWorkshopSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only = True)

    class Meta:
        model = Workshop
        fields = ['id', 'workshop_name', 'city', 'rating_avg', 'latitude', 'longitude', 'distance', 'address_line']