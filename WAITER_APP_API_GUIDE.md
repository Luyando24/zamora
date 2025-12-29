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

### Get Rooms (New Dec 2025)
Fetches available room types for the property (for booking or info).

**Endpoint:** `GET /rooms/[propertyId]`

**Response:**
```json
{
  "rooms": [
    {
      "id": "room_type_uuid",
      "name": "Deluxe Room",
      "description": "A nice room",
      "base_price": 1500,
      "price": 1500, // Helper field
      "image_url": "https://...",
      "image": "https://...", // Helper field
      "capacity": 2,
      "amenities": ["wifi", "ac"]
    }
  ]
}
```

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
      "items": [
        {
           "id": "item_uuid",
           "name": "Burger",
           "quantity": 2,
           "price": 100,
           "total_price": 200,
           "notes": "No onions"
        }
      ],
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
- **Bar Orders Fix (Dec 2025):** The API now ensures `bar_order_items` are correctly populated using snapshot data, fixing the "0 items" issue.

### Get Delivered Orders
Fetches history of delivered orders.

**Endpoint:** `GET /orders/delivered/[propertyId]`

**Query Parameters:**
- `waiterName`: Filter by waiter.
- `status`: Default is "delivered".

### Create Order (Mixed Food & Bar Supported)
**Endpoint:** `POST /orders`

The API supports submitting both `foodCart` and `barCart` in a single request. The backend will automatically split them into separate processing queues (Kitchen vs Bar) but they will share the same `formData` (Table Number, Guest Name, etc).

**Request Body (Mixed Order Example):**
```json
{
  "order": {
    "propertyId": "property_uuid",
    "foodCart": [
      { "id": "food_item_id", "quantity": 1, "price": 100, "name": "Burger" }
    ],
    "barCart": [
       { "id": "bar_item_id", "quantity": 2, "price": 20, "name": "Beer" }
    ],
    "formData": {
      "tableNumber": "5",
      "waiterName": "John Doe",
      "paymentMethod": "cash",
      "notes": "No onions on burger"
    }
  }
}
```

**Response:**
Returns an array of created Order IDs (one for food, one for bar).
```json
{
  "success": true,
  "orderIds": ["food_order_uuid", "bar_order_uuid"]
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

**RLS Note (Important):**
Authentication RLS policies have been relaxed (as of Dec 28, 2025) to allow any `authenticated` user to view `orders` and `bar_orders` for their property. This ensures real-time events are received by all staff.

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

### Bar Orders Showing "0 items"
- **Cause:** Nested relationship lookup for `bar_menu_items` was failing if items were deleted or unlinked.
- **Fix:** The API now uses `items_raw` (snapshot data from `bar_order_items`) which is guaranteed to exist. The field `name` is populated from `item_name` snapshot.

### Debugging API Responses
- **Tool:** Use the debug endpoint to view raw database rows (bypassing some filters).
- **URL:** `https://zamoraapp.com/api/debug/orders/[PROPERTY_ID]`
- **Usage:** Check if orders exist and verify their `waiter_name` and `status` fields directly.

---

## 5. Data Models

### Order Object
```typescript
interface Order {
  id: string;
  order_number: number; // Unique incremental ID (e.g., 101, 102)
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

interface OrderItem {
  id: string;
  name: string; // Populated from item_name snapshot
  quantity: number;
  price: number;
  total_price: number;
  notes?: string;
}
```
