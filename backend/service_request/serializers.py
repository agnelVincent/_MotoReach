from rest_framework import serializers
from .models import ServiceRequest
from accounts.models import Workshop
from math import radians, cos, sin, asin, sqrt

class ServiceRequestSerializer(serializers.ModelSerializer):
    workshop_name = serializers.CharField(source='workshop.workshop_name', read_only=True)
    is_expired = serializers.BooleanField(source='is_past_expiry', read_only=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'vehicle_type', 'vehicle_model', 'issue_category', 'description', 'image_urls', 
            'user_latitude', 'user_longitude', 'status', 'created_at', 'expires_at', 
            'workshop_name', 'is_expired', 'completed_at', 'workshop'
        ]

        read_only_fields = ['id']

class NearbyWorkshopSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only = True)

    class Meta:
        model = Workshop
        fields = ['id', 'workshop_name', 'city', 'rating_avg', 'latitude', 'longitude', 'distance', 'address_line']

class WorkshopRequestActionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['ACCEPTED', 'REJECTED'])