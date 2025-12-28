# Zamora Mobile API Guide

This guide details the API endpoints available for the Zamora mobile application to interact with the Zamora HMS backend.

**Base URL**: `https://zamoraapp.com` (e.g., `http://localhost:3000` for local development)

---

## 1. Fetch Properties

Retrieves a list of all active properties available on the platform.

- **Endpoint**: `/api/mobile/properties`
- **Method**: `GET`
- **Auth**: Public

### Response
Returns a JSON object containing an array of properties.

```json
{
  "properties": [
    {
      "id": "uuid-string",
      "name": "Property Name",
      "slug": "property-slug",
      "type": "hotel | restaurant | etc",
      "cover_image_url": "https://...",
      "city": "Lusaka",
      "country": "Zambia"
      // ... other fields
    }
    // ...
  ]
}
```

### Example Code
```javascript
async function fetchProperties() {
  const response = await fetch('https://zamoraapp.com/api/mobile/properties');
  const data = await response.json();
  return data.properties;
}
```

---

## 2. Fetch Property Menu & Details

Retrieves detailed information for a specific property, including its food and drink menus.

- **Endpoint**: `/api/mobile/menu/[propertyId]`
- **Method**: `GET`
- **Params**: 
  - `propertyId`: The UUID or `slug` of the property.
- **Auth**: Public

### Response
```json
{
  "property": {
    "id": "...",
    "name": "...",
    "currency_symbol": "K",
    // ... property details
  },
  "menuItems": [
    {
      "id": "...",
      "name": "Burger",
      "price": 150,
      "category": "Mains",
      "image_url": "...",
      "description": "..."
    }
  ],
  "barMenuItems": [
    {
      "id": "...",
      "name": "Mosi Lager",
      "price": 25,
      "category": "Beers"
    }
  ],
  "categories": ["Mains", "Starters", ...],
  "barCategories": ["Beers", "Wines", ...]
}
```

### Example Code
```javascript
async function fetchPropertyDetails(propertyId) {
  const response = await fetch(`https://zamoraapp.com/api/mobile/menu/${propertyId}`);
  if (!response.ok) throw new Error('Failed to fetch menu');
  return await response.json();
}
```

---

## 3. Submit Order (Food & Drinks)

Submits a guest order for food and/or drinks. Supports guest checkout (no login required).

- **Endpoint**: `/api/mobile/orders`
- **Method**: `POST`
- **Auth**: Public (Guest)

### Request Body
```json
{
  "propertyId": "uuid-of-property",
  "formData": {
    "name": "Guest Name",
    "phone": "0971234567",
    "tableNumber": "5", // Optional, if restaurant
    "roomNumber": "101", // Optional, if hotel room service
    "paymentMethod": "cash | card | room_bill",
    "notes": "No onions"
  },
  "foodCart": [
    {
      "id": "menu-item-id",
      "quantity": 2,
      "price": 150,
      "name": "Burger", // Snapshot data
      "selectedOptions": ["Cheese", "Medium"] // Optional array of strings
    }
  ],
  "barCart": [ // Optional
    {
      "id": "bar-item-id",
      "quantity": 1,
      "price": 25,
      "name": "Mosi"
    }
  ]
}
```

### Response
```json
{
  "success": true,
  "orderIds": ["uuid-food-order", "uuid-bar-order"],
  "errors": [] // Array of error strings if partial failure
}
```

### Example Code
```javascript
async function submitOrder(orderData) {
  const response = await fetch('https://zamoraapp.com/api/mobile/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return await response.json();
}
```

---

## 4. Create Booking

Creates a room reservation.

- **Endpoint**: `/api/bookings`
- **Method**: `POST`
- **Auth**: Public

### Request Body
```json
{
  "propertyId": "uuid-of-property",
  "roomTypeId": "uuid-of-room-type",
  "checkIn": "YYYY-MM-DD",
  "checkOut": "YYYY-MM-DD",
  "guestDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "097..."
  }
}
```

### Response
Returns the created booking object or an error if no rooms are available.

```json
{
  "id": "booking-uuid",
  "status": "confirmed",
  // ... booking details
}
```
*Error Response (409 Conflict)*:
```json
{ "error": "No rooms available for these dates" }
```

### Example Code
```javascript
async function createBooking(bookingData) {
  const response = await fetch('https://zamoraapp.com/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  });
  
  if (response.status === 409) {
    alert('Room not available!');
    return;
  }
  
  return await response.json();
}
```

---

## 5. Restaurant Owner API (Protected)

These endpoints are designed for the **Restaurant Owner Mobile App**. They allow owners to view orders, update statuses, and manage availability.

**Authentication Required**:
You must include the `Authorization` header with a valid Supabase Access Token (JWT) obtained after logging in via Supabase Auth.

`Authorization: Bearer <your-access-token>`

### 5.1 Fetch Active Orders
Retrieves a unified list of recent Food and Bar orders for all properties owned by the authenticated user.

- **Endpoint**: `/api/mobile/owner/orders`
- **Method**: `GET`

**Response:**
```json
{
  "orders": [
    {
      "id": "order-uuid",
      "type": "food", // or "bar"
      "status": "pending", // pending, preparing, ready, delivered, cancelled
      "total_amount": 150,
      "guest_name": "Guest Name",
      "guest_room_number": "Table 5",
      "created_at": "2024-...",
      "items": [
        { "name": "Burger", "quantity": 1, "notes": "No onions" }
      ]
    },
    // ...
  ]
}
```

### 5.2 Update Order Status
Updates the status of a specific order (e.g., move from 'pending' to 'preparing').

- **Endpoint**: `/api/mobile/owner/orders`
- **Method**: `PATCH`
- **Body**:
```json
{
  "orderId": "uuid-of-order",
  "type": "food", // "food" or "bar" (Required to target correct table)
  "status": "preparing" // pending | preparing | ready | delivered | cancelled
}
```

### 5.3 Owner Dashboard Stats
Returns simple daily statistics for the owner's dashboard.

- **Endpoint**: `/api/mobile/owner/stats`
- **Method**: `GET`

**Response:**
```json
{
  "totalOrders": 12,
  "pendingOrders": 3,
  "totalRevenue": 4500,
  "properties": 1
}
```

### 5.4 Manage Menu Availability
Toggle availability of items (e.g., mark "Sold Out").

- **Endpoint**: `/api/mobile/owner/menu`
- **Method**: `GET` (Fetch all items)
- **Method**: `POST` (Update availability)

**POST Body:**
```json
{
  "itemId": "uuid-menu-item",
  "type": "food", // "food" or "bar"
  "isAvailable": false
}
```

---

## 6. Waiter API

These endpoints are designed for the **Waiter / Staff App**.

### 6.1 Fetch Waiter's Orders (My Orders)
Retrieves orders (Food & Bar) for a specific property. Can be filtered by waiter name and/or order status.

- **Endpoint**: `/api/mobile/orders/[propertyId]`
- **Method**: `GET`
- **Params**:
  - `propertyId`: UUID of the property (in URL).
  - `waiterName`: (Query Param) Name of the waiter to filter by (e.g., `?waiterName=John`).
  - `status`: (Query Param, Optional) Comma-separated list of statuses to filter by (e.g., `?status=pending,preparing`).
- **Auth**: Public (relies on property ID and waiter name filter).

**Response:**
Returns a JSON object with a list of orders, sorted by newest first.

```json
{
  "orders": [
    {
      "id": "order-uuid",
      "type": "food", // or "bar"
      "status": "pending",
      "total_amount": 150,
      "guest_name": "Guest Name",
      "guest_room_number": "Table 5",
      "notes": "No onions\n(Waiter: John)",
      "created_at": "2024-...",
      "items": [
        {
           "id": "item-uuid",
           "quantity": 1,
           "name": "Burger",
           "unit_price": 150,
           "total_price": 150,
           "notes": "No cheese"
        }
      ]
    }
  ]
}
```

### 6.2 Fetch New Orders (Pending)
Retrieves all **pending** orders (Food & Bar) for a specific property. This is particularly useful for seeing new orders coming in from **QR code scans** by guests, which are unassigned to any waiter.

- **Endpoint**: `/api/mobile/orders/new/[propertyId]`
- **Method**: `GET`
- **Params**:
  - `propertyId`: UUID of the property (in URL).
  - `status`: (Query Param, Optional) Comma-separated list of statuses to filter by (e.g., `?status=pending`). Defaults to `pending` if not specified.
- **Auth**: Public (relies on property ID).

**Response:**
Returns a JSON object with a list of **pending** orders, sorted by newest first.

```json
{
  "orders": [
    {
      "id": "order-uuid",
      "type": "food", // or "bar"
      "status": "pending",
      "total_amount": 200,
      "guest_room_number": "Room 101",
      "created_at": "...",
      "items": [ ... ]
    }
  ]
}
```

### 6.3 Fetch Delivered Orders
Retrieves all **delivered** orders (Food & Bar) for a specific property. This is useful for clearing tables or reviewing completed service.

- **Endpoint**: `/api/mobile/orders/delivered/[propertyId]`
- **Method**: `GET`
- **Params**:
  - `propertyId`: UUID of the property (in URL).
  - `status`: (Query Param, Optional) Comma-separated list of statuses to filter by. Defaults to `delivered` if not specified.
- **Auth**: Public (relies on property ID).

**Response:**
Returns a JSON object with a list of **delivered** orders, sorted by newest first.

```json
{
  "orders": [
    {
      "id": "order-uuid",
      "type": "food", // or "bar"
      "status": "delivered",
      "total_amount": 200,
      "guest_room_number": "Room 101",
      "created_at": "...",
      "items": [ ... ]
    }
  ]
}
```
