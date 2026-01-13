# Mobile Authentication API Guide

This guide details the API endpoints for User Registration, Login, and Password Reset for the Zamora Mobile App.

## Base URL
`https://zamoraapp.com` (Production)
`http://localhost:3000` (Development)

---

## 1. User Registration

Creates a new user account with the default role of `user`.

**Endpoint:** `POST /api/auth/register`

### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+260970000000"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "user"
  },
  "session": {
    "access_token": "jwt_token...",
    "refresh_token": "refresh_token...",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": { ... }
  }
}
```

### Response (Error)
```json
{
  "error": "User already registered" 
}
```

---

## 2. User Login

Authenticates a user and returns their session and profile details.

**Endpoint:** `POST /api/mobile/auth/login`

### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "securePassword123"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "user": {
    "id": "uuid-string",
    "email": "jane.doe@example.com",
    "role": "user", // 'user', 'waiter', 'admin', etc.
    "firstName": "Jane",
    "lastName": "Doe",
    "propertyId": null, // Present if user is staff/owner
    "property": null    // Present if user is staff/owner
  },
  "session": {
    "access_token": "jwt_token...",
    "refresh_token": "refresh_token..."
  }
}
```

### Notes
*   **Store the `access_token`** securely (e.g., SecureStore/Keychain).
*   Include the token in the `Authorization` header for protected endpoints:
    `Authorization: Bearer <access_token>`

---

## 3. Password Reset

Initiates the password reset flow by sending an email to the user.

**Endpoint:** `POST /api/mobile/auth/reset-password`

### Request Body
```json
{
  "email": "jane.doe@example.com"
}
```

### Response (Success - 200)
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### How it works
1.  User enters email in the mobile app.
2.  App calls this endpoint.
3.  User receives an email with a "Reset Password" link.
4.  User clicks the link, which opens a web page (or app via Deep Link if configured) to enter a new password.

---

## 4. Error Handling

All endpoints follow a standard error response format:

```json
{
  "error": "Description of the error"
}
```

**Common HTTP Status Codes:**
*   `200`: Success
*   `400`: Bad Request (Missing fields, invalid data)
*   `401`: Unauthorized (Invalid credentials)
*   `500`: Internal Server Error
