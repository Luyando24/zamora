# Table Management API Guide

This guide details the API endpoints for managing restaurant tables and table types (Indoor, Outdoor, etc.) in the Zamora system.
These endpoints are designed for the **Restaurant Manager Mobile App**.

## Base URL
`/api/mobile/manager`

## Authentication
All endpoints require a valid Manager Session (JWT).
You must also provide `propertyId` in the query string or body as specified.

---

## 1. Table Types (Categories)

Manage categories like "Indoor", "Outdoor", "VIP Booth", etc.

### List Table Types
**GET** `/table-types?propertyId={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Indoor",
    "description": "Main dining hall",
    "capacity": 4,
    "image_url": "https://...",
    "property_id": "uuid"
  }
]
```

### Create Table Type
**POST** `/table-types`

**Body:**
```json
{
  "propertyId": "uuid",
  "name": "Outdoor Patio",
  "description": "Tables with a view",
  "capacity": 4,
  "image_url": "optional_url"
}
```

### Update Table Type
**PUT** `/table-types/{id}`

**Body:**
```json
{
  "propertyId": "uuid",
  "name": "Outdoor Patio (Renovated)",
  "capacity": 6
}
```

### Delete Table Type
**DELETE** `/table-types/{id}?propertyId={uuid}`

---

## 2. Tables (Units)

Manage individual tables (e.g., Table 1, Table 2, A1, B2).

### List Tables
**GET** `/tables?propertyId={uuid}`

**Response:**
```json
[
  {
    "id": "uuid",
    "room_number": "10",  // This is the Table Number
    "room_type_id": "uuid",
    "status": "clean", // clean, occupied, dirty
    "room_types": {
      "name": "Indoor"
    }
  }
]
```

### Create Table
**POST** `/tables`

**Body:**
```json
{
  "propertyId": "uuid",
  "room_number": "12", // Table Number
  "room_type_id": "uuid", // ID from Table Types
  "status": "clean"
}
```

### Update Table
**PUT** `/tables/{id}`

**Body:**
```json
{
  "propertyId": "uuid",
  "room_number": "12A",
  "status": "occupied"
}
```

### Delete Table
**DELETE** `/tables/{id}?propertyId={uuid}`

---

## 3. QR Code Integration

Tables in Zamora are linked to the Guest Menu via QR Codes.

### QR Code URL Format
The QR code for a table should point to the following URL:
`https://[host]/menu/[propertyId]?table=[table_number]`

Example:
`https://zamora.app/menu/123e4567-e89b-12d3-a456-426614174000?table=5`

### Checkout Flow Behavior
- When a guest scans a **Table QR Code** (`?table=5`), the checkout page will:
  - Pre-fill the "Table Number" field with `5`.
  - Show "Table Verified".
  - **NOT** trigger any Room-specific logic (e.g. Room Charge validation will require manual room entry if needed, or be disabled for pure restaurant guests).

- When a guest scans a **Room QR Code** (`?room=101`), the checkout page will:
  - Pre-fill the "Room Number" field.
  - Show "Delivery Location Verified".
  - **NOT** fill the Table Number field.
