from django.urls import path
from .views import CreateCheckoutSessionView, StripeWebhookView, WalletView, WalletTransactionListView, AddMoneyCheckoutView, PayPlatformFeeWithWalletView

urlpatterns = [
    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('webhook/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('wallet/', WalletView.as_view(), name='wallet'),
    path('wallet/transactions/', WalletTransactionListView.as_view(), name='wallet-transactions'),
    path('wallet/add-money/', AddMoneyCheckoutView.as_view(), name='add-money'),
    path('wallet/pay-fee/', PayPlatformFeeWithWalletView.as_view(), name='pay-fee-wallet'),
]
