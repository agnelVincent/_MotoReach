from rest_framework import serializers
from .models import Complaint

class ComplaintSerializer(serializers.ModelSerializer):
    reporter = serializers.CharField(source = 'reporter.full_name')
    reported_user = serializers.CharField(source = 'reported_user.full_name')
    class Meta:
        model = Complaint
        fields = '__all__'

class AdminComplaintSerializer(serializers.ModelSerializer):
    reporter_email = serializers.EmailField(source='reporter.email', read_only=True)
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    reporter_role = serializers.CharField(source='reporter.role', read_only=True)
    reported_user_email = serializers.EmailField(source='reported_user.email', read_only=True)
    reported_user_name = serializers.CharField(source='reported_user.full_name', read_only=True)
    reported_user_role = serializers.CharField(source='reported_user.role', read_only=True)
    is_blocked = serializers.SerializerMethodField()
    service_request_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Complaint
        fields = [
            'id', 'reporter', 'reporter_email', 'reporter_name', 'reporter_role',
            'reported_user', 'reported_user_email', 'reported_user_name', 'reported_user_role',
            'is_blocked', 'service_request', 'service_request_details', 'description', 'image', 'phone_number',
            'status', 'created_at', 'resolved_at'
        ]
        
    def get_is_blocked(self, obj):
        return not obj.reported_user.is_active

    def get_service_request_details(self, obj):
        sr = obj.service_request
        return {
            'vehicle': f"{sr.vehicle_type} - {sr.vehicle_model}",
            'issue': sr.issue_category,
            'status': sr.status,
            'description': sr.description,
            'estimate_amount': sr.execution.estimate_amount if hasattr(sr, 'execution') else 0
        }