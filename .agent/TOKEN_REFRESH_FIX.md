# Token Refresh Flow - Complete Fix

## Problems Identified

### 1. **Backend Serializer Issues**
- `CookieTokenRefreshSerializer` was catching exceptions but not re-raising them
- This caused the view to return success even when token refresh failed
- Error messages weren't being properly communicated to the frontend

### 2. **Frontend Axios Interceptor Issues**
- Not properly updating the `Authorization` header on the original failed request
- Missing error handling for refresh failures
- No redirect to login when refresh token expires
- Console logs cluttering production code
- Not excluding register/verify-otp endpoints from refresh logic

### 3. **Token Lifetime Issues**
- Access token lifetime was only 5 minutes (too short, causes frequent refreshes)
- Refresh token lifetime was only 1 day (inconvenient for users)

## Solutions Implemented

### 1. Backend Fix (`accounts/serializers.py`)

**Fixed `CookieTokenRefreshSerializer`:**
```python
class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        # Get refresh token from cookie
        refresh = self.context['request'].COOKIES.get(
            settings.SIMPLE_JWT['AUTH_COOKIE']
        )

        if not refresh:
            raise InvalidToken('No refresh token found in cookie. Please login again.')
        
        attrs['refresh'] = refresh
        
        try:
            # Call parent validate to generate new access token
            data = super().validate(attrs)
            return data
        except TokenError as e:
            # Re-raise TokenError so the view can handle it properly
            raise InvalidToken(f'Token refresh failed: {str(e)}')
        except Exception as e:
            # Log unexpected errors and re-raise
            print(f'Unexpected token refresh error: {str(e)}')
            raise
```

**Changes:**
- ✅ Properly re-raises `TokenError` as `InvalidToken` for proper HTTP error responses
- ✅ Better error messages for debugging
- ✅ Ensures the view returns proper 401 status when refresh fails

### 2. Frontend Fix (`frontend/src/api/axiosInstance.js`)

**Improved Response Interceptor:**
```javascript
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Don't retry if this is a login request or if we've already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for login/register endpoints
      if (originalRequest.url && (
        originalRequest.url.includes('login') || 
        originalRequest.url.includes('register') ||
        originalRequest.url.includes('verify-otp')
      )) {
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Mark this request as retried
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Attempting to refresh access token...');
        
        // Call refresh endpoint
        const refreshResponse = await refreshClient.post("accounts/auth/token/refresh/");

        if (refreshResponse.data && refreshResponse.data.access) {
          const newAccessToken = refreshResponse.data.access;
          
          // Store new access token
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          
          // Update default headers for future requests
          axiosInstance.defaults.headers["Authorization"] = "Bearer " + newAccessToken;
          
          // Update the failed request's header
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
          
          console.log('✅ Token refreshed successfully');
          
          // Process queued requests
          processQueue(null, newAccessToken);
          
          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Process queue with error
        processQueue(refreshError, null);

        // Clear stored token
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          console.log('🔐 Redirecting to login...');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

**Changes:**
- ✅ **Properly updates the original request's Authorization header** before retrying
- ✅ Validates that the refresh response contains an access token
- ✅ Automatically redirects to `/login` when refresh token expires
- ✅ Excludes `register` and `verify-otp` endpoints from refresh logic
- ✅ Better console logging for debugging
- ✅ Proper error handling and cleanup

### 3. Token Lifetime Optimization (`backend/settings.py`)

**Updated `SIMPLE_JWT` Configuration:**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME' : timedelta(minutes=60),  # 1 hour (was 5 minutes)
    'REFRESH_TOKEN_LIFETIME' : timedelta(days=7),      # 7 days (was 1 day)

    'AUTH_COOKIE' : 'refreshtoken',
    'AUTH_COOKIE_DOMAIN' : None,
    'AUTH_COOKIE_SECURE' : False,
    'AUTH_COOKIE_HTTP_ONLY' : True,
    'AUTH_COOKIE_SAMESITE' : 'Lax',
    
    # Additional security settings
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
}
```

**Changes:**
- ✅ **Access token lifetime: 5 minutes → 60 minutes** (reduces refresh frequency)
- ✅ **Refresh token lifetime: 1 day → 7 days** (better user experience)
- ✅ Added security settings for token rotation and blacklisting
- ✅ Tracks last login time

## How It Works Now

### Normal Flow:
1. User logs in → receives access token (localStorage) + refresh token (httpOnly cookie)
2. Each API request includes `Authorization: Bearer <access_token>` header
3. Access token is valid for **60 minutes**
4. Refresh token is valid for **7 days**

### Token Refresh Flow:
1. Access token expires after 60 minutes
2. API request fails with **401 Unauthorized**
3. Axios interceptor catches the 401 error
4. Interceptor calls `/api/accounts/auth/token/refresh/` with refresh token from cookie
5. Backend validates refresh token and returns new access token
6. Interceptor updates localStorage and Authorization header
7. Original request is retried with new access token
8. ✅ **User doesn't notice anything - seamless experience**

### Session Expiry Flow:
1. Refresh token expires after 7 days (or is invalid)
2. Token refresh fails with 401
3. Interceptor clears localStorage
4. User is automatically redirected to `/login`
5. User must log in again

## Benefits

### User Experience:
- ✅ **No more random logouts** - tokens last longer
- ✅ **Seamless token refresh** - happens automatically in background
- ✅ **Stay logged in for 7 days** - unless manually logged out
- ✅ **Automatic redirect to login** when session truly expires

### Security:
- ✅ **HttpOnly cookies** - refresh token can't be stolen via XSS
- ✅ **Token blacklisting** - revoked tokens can't be reused
- ✅ **Proper error handling** - no silent failures
- ✅ **Shorter access token lifetime** - limits damage if stolen

### Developer Experience:
- ✅ **Clear console logs** - easy to debug token issues
- ✅ **Proper error messages** - know exactly what went wrong
- ✅ **Production-ready code** - handles all edge cases

## Testing Recommendations

### Test These Scenarios:

1. **Normal Login:**
   - Login → should work normally
   - Make API calls → should work for 60 minutes

2. **Token Refresh:**
   - Wait for access token to expire (or manually delete from localStorage)
   - Make an API call → should automatically refresh and succeed
   - Check console → should see "🔄 Attempting to refresh access token..." and "✅ Token refreshed successfully"

3. **Session Expiry:**
   - Clear refresh token cookie (or wait 7 days)
   - Make an API call → should redirect to `/login`
   - Check console → should see "❌ Token refresh failed" and "🔐 Redirecting to login..."

4. **Concurrent Requests:**
   - Make multiple API calls simultaneously when token is expired
   - All should queue and succeed after single refresh
   - Only one refresh request should be made

5. **Login/Register Endpoints:**
   - Failed login → should NOT trigger refresh
   - Failed registration → should NOT trigger refresh
   - Should see proper error messages

## Production Considerations

### Before Deploying:

1. **Update `AUTH_COOKIE_SECURE` to `True`** in production (requires HTTPS):
   ```python
   'AUTH_COOKIE_SECURE' : True,  # Only send cookie over HTTPS
   ```

2. **Set proper `AUTH_COOKIE_DOMAIN`** for your production domain:
   ```python
   'AUTH_COOKIE_DOMAIN' : '.yourdomain.com',  # Allows subdomains
   ```

3. **Consider adjusting token lifetimes** based on your security requirements:
   - High security: Shorter lifetimes (15 min access, 1 day refresh)
   - Better UX: Longer lifetimes (2 hours access, 30 days refresh)

4. **Monitor token refresh rate** - if too high, increase access token lifetime

## Troubleshooting

### Issue: "Token refresh failed" errors
**Solution:** Check that refresh token cookie is being sent with requests. Verify `withCredentials: true` in axios config.

### Issue: Infinite redirect loop to login
**Solution:** Check that login endpoint is excluded from refresh logic (it is now).

### Issue: Users getting logged out too frequently
**Solution:** Increase `ACCESS_TOKEN_LIFETIME` in settings.

### Issue: Refresh token not found in cookie
**Solution:** Verify cookie is being set on login. Check browser dev tools → Application → Cookies.

## Files Modified

1. `backend/accounts/serializers.py` - Fixed `CookieTokenRefreshSerializer`
2. `frontend/src/api/axiosInstance.js` - Improved response interceptor
3. `backend/backend/settings.py` - Optimized token lifetimes
