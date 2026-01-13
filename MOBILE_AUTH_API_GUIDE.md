# Mobile Authentication API Guide

This guide details the API endpoints for user authentication in the Zamora Mobile App.

## 1. User Registration

**Endpoint:** `POST /api/auth/register`

Creates a new user account.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+260970000000"
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "session": {
    "access_token": "jwt-token-string",
    "refresh_token": "refresh-token-string",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": { ... }
  }
}
```

### Response (Error - 400 Bad Request)
```json
{
  "error": "Email and password are required" 
  // or "User already registered"
}
```

---

## 2. User Login

**Endpoint:** `POST /api/mobile/auth/login`

Authenticates a user and returns their profile and session tokens.

### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "user", // or 'staff', 'admin'
    "firstName": "John",
    "lastName": "Doe",
    "propertyId": null, // Present if user is staff/admin
    "property": null    // Present if user is staff/admin
  },
  "session": {
    "access_token": "jwt-token-string",
    "refresh_token": "refresh-token-string"
  }
}
```

### Response (Error - 401 Unauthorized)
```json
{
  "error": "Invalid login credentials"
}
```

---

## 3. Password Reset

**Endpoint:** `POST /api/mobile/auth/reset-password`

Initiates the password reset process by sending an email to the user.

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Response (Error - 400 Bad Request)
```json
{
  "error": "Email is required"
}
```

## 4. Handling Authentication State

- Store the `access_token` and `refresh_token` securely (e.g., SecureStore in React Native).
- Include the `access_token` in the Authorization header for protected endpoints:
  ```http
  Authorization: Bearer <access_token>
  ```
- Use the Supabase client SDK (if available) or handle token refresh manually when 401 errors occur.
