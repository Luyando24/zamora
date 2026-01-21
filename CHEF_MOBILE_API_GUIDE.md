# Chef Mobile API Integration Guide

This guide provides the necessary endpoints and workflow instructions for developing the Chef Mobile Application for Zamora Hospitality OS.

## 1. Authentication

Chefs use the same authentication endpoint as all other staff members.

**Endpoint:** `POST /api/mobile/auth/login`
**Payload:**
```json
{
  "email": "chef@example.com",
  "password": "your_password"
}
```

**Response:**
Upon successful login, the user object will contain `role: "chef"`.

---

## 2. Order Listing (Kitchen View)

Retrieve food orders that are pending, in preparation, or ready for serving.

**Endpoint:** `GET /api/mobile/chef/orders/[propertyId]`
**Query Parameters:**
- `status`: Optional. A comma-separated list. Defaults to `pending,preparing,ready`.
- `limit`: Optional. Defaults to `50`.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response Example:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order-uuid-1",
      "created_at": "2023-10-27T10:00:00Z",
      "status": "pending",
      "guest_name": "John Doe",
      "guest_room_number": "101",
      "total_amount": 150.00,
      "notes": "No onions please",
      "order_items": [
        {
          "id": "item-uuid",
          "name": "Burger",
          "quantity": 2,
          "notes": "Extra cheese"
        }
      ]
    }
  ]
}
```

---

## 3. Update Order Status

Update the production status of an order as it moves through the kitchen.

**Endpoint:** `POST /api/mobile/chef/order/[orderId]/status`
**Headers:**
- `Authorization: Bearer <access_token>`

**Payload:**
```json
{
  "status": "preparing", // can be: "preparing", "ready", "delivered", or "cancelled"
  "type": "food" // optional. can be: "food" or "bar". defaults to "food"
}
```

---

## 4. Implementation Instructions

### State Management
- Use a state management library (like Redux or Zustand) to cache the list of orders.
- Orders should be sorted by `created_at` in ascending order (oldest first) to ensure a "First-In-First-Out" workflow.

### Real-time Updates (Recommended)
While the `GET` endpoint is available, for a premium kitchen experience, you should implement Supabase Real-time to listen for changes to the `orders` table:
```javascript
const channel = supabase
  .channel('kitchen-updates')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      // Refresh order list or update local state
    }
  )
  .subscribe();
```

## 5. Workflow Guide for Chefs

The mobile app should follow this state transition:

1.  **Incoming Orders**: Display orders with `status: "pending"` in a "New" tab.
2.  **Start Cooking**: When the chef starts an order, call `POST /api/mobile/chef/order/[orderId]/status` with `status: "preparing"`.
3.  **Finish Cooking**: When the meal is ready, call `POST /api/mobile/chef/order/[orderId]/status` with `status: "ready"`.
    - This notifies the waiter that the food is ready for pickup.
4.  **Optional - Marking as Delivered**: If the chef is also responsible for handing over to the waiter or guest, they can set the status to `delivered`.

## 5. Troubleshooting: "Orders not appearing"

If the chef sees no orders:
1. Ensure the `propertyId` matches the property assigned to the chef account.
2. Check that there are active food orders (not bar orders) with the correct status in the database.
3. Verify that the user has the `chef`, `admin`, or `manager` role.
