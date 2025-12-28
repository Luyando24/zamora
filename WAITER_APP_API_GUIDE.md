# Waiter App API & Developer Guide

This guide documents the API endpoints, authentication flow, and real-time subscription logic for the Zamora Waiter App.

## Base URL
`https://zamoraapp.com/api/mobile`

---

## 1. Authentication

### Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "waiter@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_uuid",
    "email": "waiter@example.com",
    "role": "waiter",
    "firstName": "John",
    "lastName": "Doe",
    "propertyId": "property_uuid",
    "property": {
      "id": "property_uuid",
      "name": "Zamora Restaurant",
      "currency_symbol": "K",
      "logo_url": "..."
    }
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "..."
  }
}
```

**Notes:**
- Store the `access_token` securely.
- Include `Authorization: Bearer <access_token>` in all subsequent requests.

---

## 2. Orders API

### Get Active Orders (My Orders)
Fetches orders assigned to the specific waiter.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `propertyId` (Required): The ID of the property.
- `waiterName` (Optional): Filter by waiter's name (e.g., "John Doe").
- `status` (Optional): Comma-separated list of statuses (e.g., "pending,preparing,processing,ready").

**Response:**
```json
{
  "orders": [
    {
      "id": "order_uuid",
      "type": "food", // or "bar"
      "status": "pending",
      "table_number": "5",
      "waiter_name": "John Doe",
      "items": [...],
      "created_at": "ISO_DATE"
    }
  ]
}
```

### Get New Orders (Unassigned)
Fetches unassigned orders (e.g., QR code orders) for the "New" tab.

**Endpoint:** `GET /orders/new/[propertyId]`

**Logic:**
- Returns orders where `waiter_name` is:
  - `NULL` or Empty
  - Generic names: "Table X", "Walk-in", "Guest", "Customer", "Unknown"
- **Developer Note:** These orders are available for any waiter to "Claim".

### Get Delivered Orders
Fetches history of delivered orders.

**Endpoint:** `GET /orders/delivered/[propertyId]`

**Query Parameters:**
- `waiterName`: Filter by waiter.
- `status`: Default is "delivered".

### Create Order
**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "order": {
    "propertyId": "property_uuid",
    "foodCart": [
      { "id": "item_id", "quantity": 2, "price": 100, "name": "Burger" }
    ],
    "barCart": [],
    "formData": {
      "tableNumber": "5",
      "waiterName": "John Doe",
      "paymentMethod": "cash", // or "card", "room_bill"
      "notes": "No onions"
    }
  }
}
```

### Update Order Status / Assign Waiter
**Endpoint:** `PATCH /order/[orderId]`

**Request Body:**
```json
{
  "type": "food", // or "bar" (REQUIRED)
  "status": "delivered", // Optional
  "waiter_name": "John Doe", // Optional (use to assign order)
  "formData": { ... } // Optional
}
```

**Common Use Cases:**
- **Mark as Delivered:** `{ "status": "delivered", "type": "food" }`
- **Cancel Order:** `{ "status": "cancelled", "type": "food" }`
- **Claim Order:** `{ "waiter_name": "John Doe", "type": "food" }`

### Delete Order
**Endpoint:** `DELETE /order/[orderId]`

**Query Parameters:**
- `type`: "food" or "bar" (Required)

---

## 3. Real-time Updates (Supabase)

To ensure the app updates instantly without pulling-to-refresh, implement Supabase Realtime subscriptions.

**Tables to Watch:**
1. `orders` (Food)
2. `bar_orders` (Drinks)

**Filter:**
- `property_id=eq.YOUR_PROPERTY_ID`

**Events:**
- Listen for `*` (INSERT, UPDATE, DELETE).

**Client-side Implementation Example (React Native):**
```javascript
const channel = supabase
  .channel('waiter-app')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'orders',
      filter: `property_id=eq.${user.property_id}`,
    },
    (payload) => {
      console.log('Change received!', payload);
      // Refresh data
      loadData();
    }
  )
  .subscribe();
```

---

## 4. Troubleshooting & Common Issues

### CORS Errors / `net::ERR_FAILED` on PATCH
- **Cause:** Preflight `OPTIONS` request failing.
- **Fix:** Ensure the server `middleware.ts` allows `PATCH` and handles `OPTIONS` requests for `/api/mobile/*`. (Fixed as of Dec 2025).

### 401 Unauthorized
- **Cause:**
  - Token expired.
  - Token format incorrect (ensure no leading/trailing spaces).
  - Missing `Authorization` header.
- **Fix:** The API now automatically trims tokens. Ensure your client sends: `Authorization: Bearer <token>`.

### "New" Orders Not Showing
- **Cause:** API was strictly filtering for `NULL` waiter names.
- **Fix:** API now includes "Table X", "Walk-in", etc. Ensure your client-side filters also match this logic if you do post-filtering.

### Delivered Orders Disappearing
- **Cause:** Client-side filtering in `TakeOrderScreen.tsx` might be too aggressive.
- **Fix:** Ensure your client-side filter includes orders where `waiter_name` matches the user OR is a generic name (if you want to show shared history).

---

## 5. Data Models

### Order Object
```typescript
interface Order {
  id: string;
  created_at: string;
  property_id: string;
  status: 'pending' | 'preparing' | 'processing' | 'ready' | 'delivered' | 'cancelled';
  type: 'food' | 'bar';
  table_number: string;
  waiter_name: string; // or null
  total_amount: number;
  items: OrderItem[];
  guest_name?: string;
  guest_phone?: string;
  notes?: string;
}
```
