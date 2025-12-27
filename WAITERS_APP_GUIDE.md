# Zamora Waiter App Guide

This guide explains how to use the Zamora Waiter App features and the API authentication for mobile integration.

## 1. Adding a Waiter
To add a waiter to your property:
1. Log in to the **Dashboard** as an Admin or Manager.
2. Navigate to **Team Members** (`/dashboard/users`).
3. Click **Add Member**.
4. Fill in the details and select **Waiter** from the Role dropdown.
5. Example credentials:
   - Email: `waiter@example.com`
   - Password: `password123`

## 2. Mobile App Authentication API
The mobile app uses a dedicated API endpoint for login.

### Endpoint
`POST /api/mobile/auth/login`

### Request Body
```json
{
  "email": "waiter@example.com",
  "password": "your_password"
}
```

### Response (Success)
```json
{
  "success": true,
  "user": {
    "id": "user_id_uuid",
    "email": "waiter@example.com",
    "role": "waiter",
    "firstName": "John",
    "lastName": "Doe",
    "propertyId": "property_uuid",
    "property": {
        "id": "property_uuid",
        "name": "Zamora Hotel",
        "type": "hotel"
    }
  },
  "session": {
    "access_token": "jwt_token...",
    "refresh_token": "refresh_token..."
  }
}
```

### Response (Error)
```json
{
  "error": "Invalid login credentials"
}
```

## 3. Waiter Features
Once logged in, waiters have access to:
- **Orders Management**: Create, view, and update status of food and bar orders.
- **Menu**: View the current menu items.
- **Overview**: Basic dashboard overview (limited view).

### Creating Orders
Waiters can create orders for specific tables or rooms directly from the "Orders" tab in the mobile interface.
