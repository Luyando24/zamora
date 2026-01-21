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

Retrieve orders that are ready for POS registration.

### Default Behavior (Important!)
By default, this endpoint filters for orders that meet BOTH of these criteria:
1.  `status`: **"delivered"** (The waiter has served the guest)
2.  `payment_status`: **"paid"** (The guest has successfully paid)

This ensures that the cashier ONLY sees orders that are finalized and ready to be punched into the POS system.

**Endpoint:** `GET /api/mobile/cashier/orders/[propertyId]`

**Query Parameters (Overrides):**
- `status`: Optional, defaults to `delivered`. (Multiple statuses can be comma-separated, e.g., `preparing,ready,delivered`)
- `payment_status`: Optional, defaults to `paid`. Use `pending` to find unpaid orders if necessary.

**Headers:**
- `Authorization: Bearer <access_token>`

**Sample Request for "Unpaid but Delivered":**
`GET /api/mobile/cashier/orders/[propertyId]?payment_status=pending`

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

Mark an order as successfully registered in the POS system. This updates the order status to `pos_completed`. Once an order is `pos_completed`, it will **automatically disappear** from the default listing (since it's no longer just "delivered").

**Endpoint:** `POST /api/mobile/cashier/order/[orderId]/pos`
**Payload:**
```json
{
  "type": "food" // or "bar"
}
```

## 4. Troubleshooting: "Why are no orders showing up?"

If the mobile dev sees an empty `orders` array, check the following:
1.  **Status**: Are there any orders in the database with exactly `status = 'delivered'`?
2.  **Payment**: Are those orders also marked as `payment_status = 'paid'`?
3.  **Property**: Is the `propertyId` in the URL correct for the logged-in user?
4.  **Role**: Ensure the logged-in user has the `cashier` role.
5.  **POS Completion**: If an order was already registered, its status is `pos_completed` and it will not show up in the default "delivered" list.

## 5. Order History

Retrieve orders that have already been registered in the POS or cancelled.

**Endpoint:** `GET /api/mobile/cashier/history/[propertyId]`
**Query Parameters:**
- `status`: Optional, defaults to `pos_completed,cancelled`.
- `limit`: Optional, defaults to `50`.

**Headers:**
- `Authorization: Bearer <access_token>`

**Response:**
Returns an array of orders similar to the Order Listing endpoint, but filtered for history.

## 6. Workflow Guide: Moving Orders to History

To "move" an order to history on the mobile app, follow this workflow:

1.  **List Pending Orders**: Call `GET /api/mobile/cashier/orders/[propertyId]`. This returns orders that are `delivered` and `paid`.
2.  **Register to POS**: When the cashier finishes registering an order in the physical POS, the app should call `POST /api/mobile/cashier/order/[orderId]/pos`.
3.  **Automatic Move**: Upon a successful POST, the server updates the status to `pos_completed`. 
4.  **UI Update**: 
    - The order will **no longer appear** in the `GET /api/mobile/cashier/orders/...` list (active tab).
    - The order **will now appear** in the `GET /api/mobile/cashier/history/...` list (history tab).

