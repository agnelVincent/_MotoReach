from rest_framework import serializers
from .models import ServiceRequest, WorkshopConnection
from accounts.models import Workshop
from math import radians, cos, sin, asin, sqrt

import cloudinary.uploader

class ServiceRequestSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'vehicle_type', 'vehicle_model', 'issue_category', 
            'description', 'image_urls', 'user_latitude', 'user_longitude',
            'images', 'status', 'platform_fee_paid', 'active_connection', 'created_at'
        ]
        read_only_fields = ['id', 'image_urls', 'status', 'platform_fee_paid', 'active_connection']

    active_connection = serializers.SerializerMethodField()

    def get_active_connection(self, obj):
        # We look for connections that are active or requested
        active_connection = WorkshopConnection.objects.filter(
            service_request=obj
        ).exclude(status__in=['REJECTED', 'AUTO_REJECTED', 'CANCELLED']).first()
        
        if active_connection:
            return {
                "id": active_connection.id,
                "workshop_id": active_connection.workshop.id,
                "workshop_name": active_connection.workshop.workshop_name,
                "status": active_connection.status,
                "workshop_phone": str(active_connection.workshop.contact_number) if active_connection.workshop.contact_number else "N/A",
                "address": f"{active_connection.workshop.address_line}, {active_connection.workshop.city}",
                "latitude": active_connection.workshop.latitude,
                "longitude": active_connection.workshop.longitude
            }
        return None

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        image_urls = validated_data.get('image_urls', [])
        
        if not isinstance(image_urls, list):
            image_urls = []

        for image in images_data:
            upload_result = cloudinary.uploader.upload(image)
            image_urls.append(upload_result['secure_url'])
        
        validated_data['image_urls'] = image_urls
        return super().create(validated_data)

class NearbyWorkshopSerializer(serializers.ModelSerializer):
    distance = serializers.FloatField(read_only = True)

    class Meta:
        model = Workshop
        fields = ['id', 'workshop_name', 'city', 'rating_avg', 'latitude', 'longitude', 'distance', 'address_line']


class WorkshopConnectionSerializer(serializers.ModelSerializer):
    service_request = ServiceRequestSerializer(read_only=True)
    user_name = serializers.CharField(source='service_request.user.full_name', read_only=True)
    user_email = serializers.EmailField(source='service_request.user.email', read_only=True)

    class Meta:
        model = WorkshopConnection
        fields = [
            'id', 'service_request', 'status', 'cancelled_by', 
            'requested_at', 'responded_at', 'user_name', 'user_email'
        ]
        read_only_fields = ['id', 'requested_at', 'responded_at']