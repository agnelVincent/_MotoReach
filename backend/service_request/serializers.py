from rest_framework import serializers
from .models import ServiceRequest
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
            'images'
        ]
        read_only_fields = ['id', 'image_urls']

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