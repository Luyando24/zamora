# Zamora Mobile API Guide

This guide details the API endpoints available for the Zamora mobile application to interact with the Zamora HMS backend.

**Base URL**: `https://your-domain.com` (e.g., `http://localhost:3000` for local development)

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
  const response = await fetch('https://your-domain.com/api/mobile/properties');
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
  const response = await fetch(`https://your-domain.com/api/mobile/menu/${propertyId}`);
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
  const response = await fetch('https://your-domain.com/api/mobile/orders', {
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
  const response = await fetch('https://your-domain.com/api/bookings', {
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
