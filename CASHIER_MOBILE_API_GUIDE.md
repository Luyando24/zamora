# Cashier Mobile API Guide

This guide details the API endpoints for the cashier role in the mobile app.

## 1. Authentication

Cashiers utilize the same login endpoint as waiters and managers. The role is returned in the user object.

**Endpoint:** `POST /api/mobile/auth/login`
**Payload:**
```json
{
  "email": "cashier@example.com",
  "password": "yourpassword"
}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "cashier@example.com",
    "role": "cashier",
    "firstName": "John",
    "lastName": "Doe",
    "propertyId": "property-uuid",
    "property": {
      "id": "property-uuid",
      "name": "Zamora Hotel",
      "type": "hotel",
      "currency_symbol": "K",
      "logo_url": "https://..."
    }
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

## 2. Dashboard - Order Listing

Retrieve orders that are ready for POS registration. By default, it returns orders that are "delivered" and "paid".

**Endpoint:** `GET /api/mobile/cashier/orders/[propertyId]`
**Query Parameters:**
- `status`: Optional, defaults to `delivered`. (Multiple statuses can be comma-separated)
- `payment_status`: Optional, defaults to `paid`.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "created_at": "2023-10-27T10:00:00Z",
      "status": "delivered",
      "payment_status": "paid",
      "total_amount": 150.00,
      "type": "food",
      "table_number": "5",
      "waiter_name": "Alice",
      "items": [
        {
          "id": "item-uuid",
          "name": "Burger",
          "quantity": 2,
          "price": 75.00,
          "total_price": 150.00,
          "notes": "No onions",
          "image": "https://..."
        }
      ]
    }
  ]
}
```

## 3. Register to POS

Mark an order as successfully registered in the POS system. This updates the order status to `pos_completed`.

**Endpoint:** `POST /api/mobile/cashier/order/[orderId]/pos`
**Payload:**
```json
{
  "type": "food" // or "bar"
}
```

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
```json
{
  "success": true,
  "message": "Order marked as pos_completed"
}
```
