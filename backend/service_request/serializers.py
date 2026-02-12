from rest_framework import serializers
from .models import ServiceRequest, WorkshopConnection, ServiceExecution, ServiceMessage
from accounts.models import Workshop, Mechanic

import cloudinary.uploader

class ServiceExecutionMechanicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.full_name')
    email = serializers.EmailField(source='user.email')
    
    class Meta:
        model = Mechanic
        fields = ['id', 'name', 'email', 'availability', 'contact_number']

class ServiceExecutionSerializer(serializers.ModelSerializer):
    lead_technician = serializers.SerializerMethodField()
    mechanics = ServiceExecutionMechanicSerializer(many=True, read_only=True)
    
    class Meta:
        model = ServiceExecution
        fields = ['id', 'lead_technician', 'mechanics', 'estimate_amount', 'started_at', 'completed_at']
        
    def get_lead_technician(self, obj):
        if obj.assigned_to:
             return {
                 "id": obj.assigned_to.id,
                 "name": obj.assigned_to.full_name,
                 "email": obj.assigned_to.email,
                 "role": "Workshop Admin"
             }
        return None

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
            'images', 'status', 'platform_fee_paid', 'active_connection', 'latest_connection', 'created_at', 'execution'
        ]
        read_only_fields = ['id', 'image_urls', 'status', 'platform_fee_paid', 'active_connection', 'latest_connection', 'execution']

    active_connection = serializers.SerializerMethodField()
    latest_connection = serializers.SerializerMethodField()
    execution = serializers.SerializerMethodField()

    def get_execution(self, obj):
        try:
            return ServiceExecutionSerializer(obj.execution).data
        except Exception:
            return None

    def get_latest_connection(self, obj):
        connection = WorkshopConnection.objects.filter(service_request=obj).order_by('-requested_at').first()
        if connection:
            return {
                "id": connection.id,
                "workshop_id": connection.workshop.id,
                "workshop_name": connection.workshop.workshop_name,
                "status": connection.status,
                "requested_at": connection.requested_at,
                "address": f"{connection.workshop.address_line}, {connection.workshop.city}",
            }
        return None

    def get_active_connection(self, obj):
        active_connection = WorkshopConnection.objects.filter(
            service_request=obj
        ).exclude(status__in=['REJECTED', 'AUTO_REJECTED', 'CANCELLED', 'WITHDRAWN']).first()
        
        if active_connection:
            return {
                "id": active_connection.id,
                "workshop_id": active_connection.workshop.id,
                "workshop_name": active_connection.workshop.workshop_name,
                "status": active_connection.status,
                "workshop_phone": str(active_connection.workshop.contact_number) if active_connection.workshop.contact_number else "N/A",
                "address": f"{active_connection.workshop.address_line}, {active_connection.workshop.city}",
                "latitude": active_connection.workshop.latitude,
                "longitude": active_connection.workshop.longitude,
                "requested_at": active_connection.requested_at
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


class ServiceMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    service_request_id = serializers.IntegerField(source='service_request.id', read_only=True)

    class Meta:
        model = ServiceMessage
        fields = [
            'id',
            'service_request',
            'service_request_id',
            'sender_type',
            'sender_user',
            'sender_workshop',
            'sender_name',
            'content',
            'read_by_user',
            'read_by_workshop',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'service_request_id',
            'sender_user',
            'sender_workshop',
            'created_at',
            'read_by_user',
            'read_by_workshop',
        ]

    def get_sender_name(self, obj):
        if obj.sender_type == 'USER' and obj.sender_user:
            return obj.sender_user.full_name
        elif obj.sender_type == 'WORKSHOP' and obj.sender_workshop:
            return obj.sender_workshop.workshop_name
        return 'Unknown'