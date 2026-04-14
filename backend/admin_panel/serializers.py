from rest_framework import serializers
from .models import Complaint

class ComplaintSerializer(serializers.ModelSerializer):
    reporter = serializers.CharField(source = 'reporter.full_name')
    reported_by = serializers.CharField(source = 'reported_user.full_name')
    class Meta:
        model = Complaint
        fields = '__all__'