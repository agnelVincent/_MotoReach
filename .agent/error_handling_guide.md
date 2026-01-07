# Error Handling Quick Reference Guide

## 🎯 Error Response Format

### Standard Error Response
```json
{
  "error": "User-friendly error message"
}
```

### Validation Error Response
```json
{
  "error": "Field Name: First validation error message",
  "details": {
    "field_name": ["Detailed error message"],
    "another_field": ["Another error message"]
  }
}
```

---

## 📋 HTTP Status Codes Reference

| Code | Use Case | Example |
|------|----------|---------|
| **200** | Success | Login successful, OTP sent |
| **201** | Created | Account created successfully |
| **400** | Bad Request | Invalid input, validation errors |
| **401** | Unauthorized | Incorrect password |
| **403** | Forbidden | Account blocked |
| **404** | Not Found | Email not found, OTP not found |
| **500** | Server Error | Database error, unexpected exception |

---

## 🔐 Login Errors

```python
# Email not found (404)
return Response(
    {'error': 'No account found with this email address. Please check your email or register.'},
    status=status.HTTP_404_NOT_FOUND
)

# Account blocked (403)
return Response(
    {'error': 'Your account has been blocked. Please contact support for assistance.'},
    status=status.HTTP_403_FORBIDDEN
)

# Incorrect password (401)
return Response(
    {'error': 'Incorrect password. Please try again or use "Forgot Password" to reset.'},
    status=status.HTTP_401_UNAUTHORIZED
)
```

---

## 📧 OTP Errors

```python
# OTP not found (404)
return Response(
    {'error': 'No OTP found for this email. Please request a new OTP or register again.'},
    status=status.HTTP_404_NOT_FOUND
)

# OTP expired (400)
return Response(
    {'error': 'OTP has expired. Please request a new OTP.'},
    status=status.HTTP_400_BAD_REQUEST
)

# Invalid OTP (400)
return Response(
    {'error': 'Invalid OTP. Please check the code and try again.'},
    status=status.HTTP_400_BAD_REQUEST
)

# Registration session expired (404)
return Response(
    {'error': 'Registration session expired. Please register again.'},
    status=status.HTTP_404_NOT_FOUND
)
```

---

## 📝 Registration Errors

```python
# Email already exists (from serializer)
raise serializers.ValidationError(
    'An account with this email already exists. Please login or use a different email.'
)

# Password too short (from serializer)
raise serializers.ValidationError(
    'Password must be at least 8 characters long.'
)

# Passwords don't match (from serializer)
raise serializers.ValidationError({
    'confirm_password': 'Passwords do not match. Please ensure both passwords are identical.'
})
```

---

## 🛠️ Error Handling Pattern

### Standard Pattern for Views

```python
def post(self, request):
    serializer = MySerializer(data=request.data)
    
    # Handle validation errors
    try:
        serializer.is_valid(raise_exception=True)
    except serializers.ValidationError as e:
        error_detail = e.detail
        if isinstance(error_detail, dict):
            first_error = next(iter(error_detail.values()))
            if isinstance(first_error, list):
                error_message = first_error[0]
            else:
                error_message = str(first_error)
        else:
            error_message = str(error_detail)
        return Response({'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
    
    # Process request
    try:
        # Your logic here
        return Response({'message': 'Success!'}, status=status.HTTP_200_OK)
    except SpecificException as e:
        return Response(
            {'error': 'Specific error message'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        print(f"Error: {e}")
        return Response(
            {'error': 'An unexpected error occurred. Please try again.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 📱 Frontend Error Display

### React Component Pattern

```javascript
// Display error from Redux state
const { error } = useSelector(state => state.auth);

// Extract error message
const errorMessage = 
  typeof error === 'object' && 'error' in error ? error.error :
  typeof error === 'object' && 'detail' in error ? error.detail :
  typeof error === 'string' ? error :
  'An unexpected error occurred.';

// Display in UI
{errorMessage && (
  <div className="error-message">
    <AlertCircle />
    <p>{errorMessage}</p>
  </div>
)}
```

---

## ✅ Best Practices Checklist

### When Writing Error Messages:

- [ ] **Be Specific**: Tell users exactly what went wrong
- [ ] **Be Actionable**: Tell users what to do next
- [ ] **Be User-Friendly**: Use plain language, no jargon
- [ ] **Be Consistent**: Follow the same format everywhere
- [ ] **Be Helpful**: Provide guidance and next steps
- [ ] **Be Professional**: Check grammar and spelling
- [ ] **Be Secure**: Don't reveal sensitive information
- [ ] **Be Logged**: Log full error details on server

### Example:
❌ **Bad**: "Error occurred"
✅ **Good**: "Invalid OTP. Please check the code and try again."

---

## 🎨 Error Message Templates

### Authentication Errors
```
"No account found with this email address. Please check your email or register."
"Incorrect password. Please try again or use 'Forgot Password' to reset."
"Your account has been blocked. Please contact support for assistance."
```

### Validation Errors
```
"{Field Name}: {Specific validation error}. {Helpful guidance}."

Examples:
"Email: An account with this email already exists. Please login or use a different email."
"Password: Password must be at least 8 characters long."
"Confirm Password: Passwords do not match. Please ensure both passwords are identical."
```

### Session/State Errors
```
"Registration session expired. Please register again."
"No pending registration found for this email and role. Please register first."
"OTP has expired. Please request a new OTP."
```

### Server Errors
```
"An unexpected error occurred. Please try again."
"Account creation failed: {specific error}. Please try again or contact support."
```

---

## 🔍 Debugging Tips

### Backend Logging
```python
# Always log the full error for debugging
print(f"Login error: {e}")
print(f"OTP Verification Error: {e}")
print(f"Registration exception: {e}")
print(f"Validation errors: {serializer.errors}")
```

### Frontend Error Handling
```javascript
// Log errors to console for debugging
console.error('Auth error:', error);

// Display user-friendly message to user
setErrorMessage(formatErrorMessage(error));
```

---

## 📚 Additional Resources

- [Django REST Framework Error Handling](https://www.django-rest-framework.org/api-guide/exceptions/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [UX Writing for Error Messages](https://uxwritinghub.com/error-message-examples/)
- [Security Best Practices for Error Messages](https://owasp.org/www-community/Improper_Error_Handling)

---

## 🚀 Quick Start

1. **Copy the error handling pattern** from this guide
2. **Use appropriate HTTP status codes** for different error types
3. **Write user-friendly messages** that are specific and actionable
4. **Log full errors** on the backend for debugging
5. **Test all error scenarios** to ensure messages are clear
6. **Get user feedback** and iterate on message clarity

---

**Remember**: Good error messages turn frustrated users into happy users! 😊
