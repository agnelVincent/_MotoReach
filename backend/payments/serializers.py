from rest_framework import serializers
from .models import Wallet, WalletTransaction

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
