from rest_framework import serializers
from .models import Wallet, WalletTransaction, Payment

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    recent_transactions = serializers.SerializerMethodField()
    
    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'updated_at', 'recent_transactions']
        read_only_fields = ['id', 'balance', 'updated_at']
    
    def get_recent_transactions(self, obj):
        transactions = obj.transactions.all().order_by('-created_at')[:10]
        return WalletTransactionSerializer(transactions, many=True).data

class PaymentHistorySerializer(serializers.ModelSerializer):
    service_request_details = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'amount', 'currency', 'payment_type', 
            'status', 'created_at', 'service_request_details', 'is_refunded'
        ]

    def get_service_request_details(self, obj):
        if obj.service_request:
            return {
                "id": obj.service_request.id,
                "vehicle": f"{obj.service_request.vehicle_model}",
                "issue": obj.service_request.issue_category
            }
        return None
