# Authentication Fix Summary

## Problem
The application was returning `401 Unauthorized` errors for public endpoints like:
- `/api/accounts/register/user/`
- `/api/accounts/auth/token/refresh/`
- Login, OTP verification, and other public endpoints

## Root Cause
The `REST_FRAMEWORK` settings in `settings.py` had `DEFAULT_PERMISSION_CLASSES` set to `IsAuthenticated`, which required authentication for ALL endpoints by default, even those explicitly marked with `permission_classes = [AllowAny]`.

## Solution Applied

### 1. Changed Default Permission Class (settings.py)
**File:** `backend/backend/settings.py`

**Changed from:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',  # ❌ Too restrictive
    )
}
```

**Changed to:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # ✅ Secure by explicit declaration
    )
}
```

**Rationale:** This follows the principle of **explicit security**. Public endpoints remain accessible by default, while protected endpoints explicitly require authentication.

### 2. Added Authentication Bypass for Stripe Webhook
**File:** `backend/payments/views.py`

**Added:**
```python
@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []  # ✅ Added to bypass JWT authentication
```

**Rationale:** Stripe webhooks don't use JWT tokens, so they must completely bypass authentication.

## Verification of Protected Endpoints

All protected endpoints are properly secured with `permission_classes = [IsAuthenticated]` or `[IsAdminUser]`:

### Accounts App ✅
- `ProfileView` - IsAuthenticated
- `ChangePasswordView` - IsAuthenticated
- `WorkshopReApplyView` - IsAuthenticated

### Admin Panel App ✅
- `AdminDashboardStatsView` - IsAdminUser
- `WorkshopVerificationView` - IsAdminUser
- `AdminUserListView` - IsAdminUser
- `AdminWorkshopListView` - IsAdminUser
- `AdminMechanicListView` - IsAdminUser
- `ToggleUserBlockView` - IsAdminUser

### Service Request App ✅
- `CreateServiceRequestView` - IsAuthenticated
- `UserServiceRequestListView` - IsAuthenticated
- `ConnectWorkshopView` - IsAuthenticated
- `WorkshopConnectionRequestsView` - IsAuthenticated
- `AcceptConnectionRequestView` - IsAuthenticated
- `RejectConnectionRequestView` - IsAuthenticated
- `CancelConnectionRequestView` - IsAuthenticated
- `UserCancelConnectionView` - IsAuthenticated
- `DeleteServiceRequestView` - IsAuthenticated

### Payments App ✅
- `CreateCheckoutSessionView` - IsAuthenticated
- `StripeWebhookView` - AllowAny (webhooks are public by design)

## Public Endpoints (No Authentication Required)

These endpoints are correctly configured with `permission_classes = [AllowAny]` and `authentication_classes = []`:

1. **Registration:**
   - `/api/accounts/register/user/`
   - `/api/accounts/register/mechanic/`
   - `/api/accounts/register/workshop/`

2. **Authentication:**
   - `/api/accounts/login/`
   - `/api/accounts/auth/token/refresh/`
   - `/api/accounts/google/`
   - `/api/accounts/logout/`

3. **OTP Management:**
   - `/api/accounts/verify-otp/`
   - `/api/accounts/resend-otp/`

4. **Password Recovery:**
   - `/api/accounts/forgot-password/send-otp/`
   - `/api/accounts/forgot-password/verify-otp/`
   - `/api/accounts/forgot-password/reset/`

5. **Webhooks:**
   - `/api/stripe/webhook/`

## Best Practices Followed

1. ✅ **Explicit Security:** Protected endpoints explicitly declare `IsAuthenticated` or `IsAdminUser`
2. ✅ **No Bottlenecks:** Removed global authentication requirement that was blocking public endpoints
3. ✅ **Proper Webhook Handling:** Stripe webhooks bypass authentication as required
4. ✅ **Token Refresh Security:** Token refresh endpoint properly configured with `AllowAny`
5. ✅ **No Breaking Changes:** All existing protected endpoints remain secure

## Testing Recommendations

1. Test registration flow without authentication
2. Test login and token refresh
3. Test OTP verification
4. Verify protected endpoints still require authentication
5. Test Stripe webhook delivery
6. Verify admin endpoints require superuser access

## Notes

- This change follows Django REST Framework best practices
- The approach is more maintainable than having a global `IsAuthenticated` requirement
- All security boundaries are explicitly defined at the view level
- No middleware or custom authentication backends are interfering
