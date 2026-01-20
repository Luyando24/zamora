# Restaurant Manager API Documentation

This documentation outlines the API endpoints available for the Restaurant Manager role within the Waiter App. These endpoints enable managers and owners to login, view business performance, and manage staff, menus, and tables.

## Authentication & Access Control

### Login
**Endpoint:** `POST /api/mobile/auth/login`

Existing login endpoint supports managers.
**Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "role": "manager",  // Check for 'manager' or 'admin'
    "propertyId": "...",
    "property": { ... }
  },
  "session": { ... }
}
```

### Access Verification
All manager endpoints require:
1.  **Authorization Header:** Bearer token from login.
2.  **Property Context:** Most endpoints require `propertyId` as a query parameter or in the body to ensure the manager has access to that specific property.

---

## Business Performance

### Get Performance Summary
**Endpoint:** `GET /api/mobile/manager/performance`

Returns aggregated sales data and top items.

**Query Parameters:**
- `propertyId` (required): The ID of the property.
- `period` (optional): `today` (default), `week`, `month`.

**Response:**
```json
{
  "period": "today",
  "summary": {
    "totalOrders": 15,
    "totalRevenue": 1250.50
  },
  "topItems": [
    { "name": "Burger", "quantity": 10, "revenue": 150.00 },
    ...
  ]
}
```

---

## Staff Management

### List Staff
**Endpoint:** `GET /api/mobile/manager/staff`

**Query Parameters:**
- `propertyId` (required)

**Response:** List of staff members (waiters, etc.).

### Create Staff
**Endpoint:** `POST /api/mobile/manager/staff`

**Body:**
```json
{
  "propertyId": "...",
  "email": "waiter@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff",
  "password": "tempPassword123"
}
```

### Update Staff
**Endpoint:** `PUT /api/mobile/manager/staff/[id]`

**Body:**
```json
{
  "propertyId": "...",
  "firstName": "Updated Name",
  "role": "manager" // Can promote/demote
}
```

### Delete Staff
**Endpoint:** `DELETE /api/mobile/manager/staff/[id]`

**Query Parameters:**
- `propertyId` (required)

---

## Menu Management

### List Menu Items
**Endpoint:** `GET /api/mobile/manager/menu`

**Query Parameters:**
- `propertyId` (required)

**Response:**
```json
{
  "food": [ ... ],
  "bar": [ ... ]
}
```

### Create Menu Item
**Endpoint:** `POST /api/mobile/manager/menu`

**Body:**
```json
{
  "propertyId": "...",
  "type": "food", // or "bar"
  "name": "New Item",
  "price": 10.00,
  "category": "Main",
  "description": "...",
  "is_available": true
}
```

### Update Menu Item
**Endpoint:** `PUT /api/mobile/manager/menu/[id]`

**Body:**
```json
{
  "propertyId": "...",
  "type": "food", // required to identify table
  "name": "Updated Name",
  "price": 12.00
}
```

### Delete Menu Item
**Endpoint:** `DELETE /api/mobile/manager/menu/[id]`

**Query Parameters:**
- `propertyId` (required)
- `type` (required): `food` or `bar`

---

## Table Management

### List Tables
**Endpoint:** `GET /api/mobile/manager/tables`

**Query Parameters:**
- `propertyId` (required)

**Response:** List of rooms/tables with status.

### Get Table Types
**Endpoint:** `GET /api/mobile/manager/table-types`

**Query Parameters:**
- `propertyId` (required)

**Response:** List of available room types (needed for creating tables).

### Create Table
**Endpoint:** `POST /api/mobile/manager/tables`

**Body:**
```json
{
  "propertyId": "...",
  "room_number": "T-10",
  "room_type_id": "...",
  "status": "clean" // clean, dirty, occupied, maintenance
}
```

### Update Table
**Endpoint:** `PUT /api/mobile/manager/tables/[id]`

**Body:**
```json
{
  "propertyId": "...",
  "status": "occupied",
  "notes": "Reserved for VIP"
}
```

### Delete Table
**Endpoint:** `DELETE /api/mobile/manager/tables/[id]`

**Query Parameters:**
- `propertyId` (required)

---

## Orders Management (Existing)

### View Orders
**Endpoint:** `GET /api/mobile/orders/[propertyId]`

Managers can use this endpoint to view live orders.
- Omit `waiterName` parameter to see all orders.
- Use `status` parameter to filter (e.g., `pending,preparing`).
