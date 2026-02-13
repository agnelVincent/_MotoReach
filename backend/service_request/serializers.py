from rest_framework import serializers
from .models import ServiceRequest, WorkshopConnection, Estimate, EstimateLineItem
from accounts.models import Workshop

import cloudinary.uploader
from .models import ServiceExecution
from accounts.models import Mechanic
from django.utils import timezone
from datetime import timedelta

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
        fields = ['id', 'lead_technician', 'mechanics', 'estimate_amount', 'escrow_paid', 'started_at', 'completed_at']
        
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
        if obj.status in ['CREATED', 'PLATFORM_FEE_PAID', 'CONNECTING', 'EXPIRED', 'CANCELLED']:
             return None
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


class EstimateLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstimateLineItem
        fields = ['id', 'item_type', 'description', 'quantity', 'unit_price', 'total', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total', 'created_at', 'updated_at']


class EstimateSerializer(serializers.ModelSerializer):
    line_items = EstimateLineItemSerializer(many=True, read_only=True)
    workshop_name = serializers.CharField(source='workshop_connection.workshop.workshop_name', read_only=True)
    service_request_id = serializers.IntegerField(source='service_request.id', read_only=True)
    
    class Meta:
        model = Estimate
        fields = [
            'id', 'service_request_id', 'workshop_connection', 'workshop_name', 'status',
            'subtotal', 'tax_rate', 'tax_amount', 'discount_amount', 'total_amount',
            'notes', 'expires_at', 'line_items',
            'created_at', 'updated_at', 'sent_at', 'approved_at', 'rejected_at'
        ]
        read_only_fields = [
            'id', 'subtotal', 'tax_amount', 'total_amount',
            'created_at', 'updated_at', 'sent_at', 'approved_at', 'rejected_at'
        ]


class EstimateLineItemCreateSerializer(serializers.ModelSerializer):
    """For create/update: only writable fields; total is computed."""
    class Meta:
        model = EstimateLineItem
        fields = ['item_type', 'description', 'quantity', 'unit_price']
        read_only_fields = []

    def _to_non_negative_float(self, value, field_name):
        if value is None or value == '':
            return 0
        try:
            n = float(value)
        except (TypeError, ValueError):
            raise serializers.ValidationError(f'{field_name} must be a non-negative number.')
        if n < 0:
            raise serializers.ValidationError(f'{field_name} must be a non-negative number.')
        return n

    def validate_quantity(self, value):
        return self._to_non_negative_float(value, 'Quantity')

    def validate_unit_price(self, value):
        return self._to_non_negative_float(value, 'Unit price')


class EstimateCreateSerializer(serializers.ModelSerializer):
    line_items = EstimateLineItemCreateSerializer(many=True, required=False)
    workshop_connection = serializers.PrimaryKeyRelatedField(queryset=WorkshopConnection.objects.all(), required=False)

    class Meta:
        model = Estimate
        fields = [
            'id', 'workshop_connection', 'status', 'tax_rate', 'discount_amount',
            'notes', 'expires_at', 'line_items'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        if not validated_data.get('expires_at'):
            validated_data['expires_at'] = timezone.now() + timedelta(days=7)
        estimate = Estimate.objects.create(**validated_data)
        for item_data in line_items_data:
            q = item_data.get('quantity', 1)
            u = item_data.get('unit_price', 0)
            EstimateLineItem.objects.create(
                estimate=estimate,
                item_type=item_data.get('item_type', 'LABOR'),
                description=item_data.get('description', ''),
                quantity=q,
                unit_price=u,
            )
        estimate.calculate_totals()
        estimate.save()
        return estimate


class EstimateUpdateSerializer(serializers.ModelSerializer):
    line_items = EstimateLineItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Estimate
        fields = [
            'status', 'tax_rate', 'discount_amount', 'notes', 'expires_at', 'line_items'
        ]

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if line_items_data is not None:
            instance.line_items.all().delete()
            for item_data in line_items_data:
                EstimateLineItem.objects.create(
                    estimate=instance,
                    item_type=item_data.get('item_type', 'LABOR'),
                    description=item_data.get('description', ''),
                    quantity=item_data.get('quantity', 1),
                    unit_price=item_data.get('unit_price', 0),
                )
        instance.calculate_totals()
        instance.save()
        return instance