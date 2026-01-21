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

### Role-Specific Defaults (Important!)
Different roles have different default filters to optimize their workflow:

- **Cashiers**: By default, this filters for `status='delivered'` AND `payment_status='paid'`.
- **Other Roles**: By default, this filters for `status='delivered'`.

**Overrides**: You can override these defaults by explicitly passing `status` or `payment_status` in the query string. For example, to find unpaid but delivered orders as a cashier, use:
`GET /api/mobile/cashier/orders/[propertyId]?payment_status=pending`

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

## 3. POS Registration

Mark an order as "POS Completed" after recording it on the physical point-of-sale machine. This action permanently moves the order to the History list.

**Endpoint:** `POST /api/mobile/cashier/order/[orderId]/pos`
**Payload:**
```json
{
  "type": "food" // Required: "food" or "bar"
}
```

**Workflow Note:** 
- Once this endpoint succeeds, the order status changes to `pos_completed`.
- It will **automatically disappear** from the default Order Listing (Section 2) since that endpoint filters for `status='delivered'` by default.
- To see the order again, you must fetch it from the **History** endpoint (Section 5).

**Troubleshooting:**
- If you receive a `404 Not Found`, it means the `orderId` does not exist in the table specified by `type`. Ensure you are passing the correct `type` ("food" for food orders, "bar" for bar orders) returned by the Order Listing.

---

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

---

## 7. CRITICAL: Fixing Orders "coming back" to Pending

If orders appear to return to the Pending POS screen after registration, the mobile developer **MUST** verify the following:

### Action 1: Check the `type` parameter
When calling `POST /api/mobile/cashier/order/[orderId]/pos`, you **MUST** include the correct `type` in the payload.
- Use `"type": "food"` for orders from the `orders` table.
- Use `"type": "bar"` for orders from the `bar_orders` table.
- **Why?** If the type is wrong, the server will return a `404 Not Found` and the order status will **NOT** change.

### Action 2: Verify the API Response
Do not assume every request succeeds. 
- If the response is `200 OK`, the order is now `pos_completed` and will be hidden from the default `GET` list.
- If the response is `404`, `400`, or `500`, the registration **FAILED** and the order remains in the pending list. Log the response body to see the specific error.

### Action 3: Strict Status Filtering
Ensure your "Pending POS" tab ONLY displays orders from the default `GET /api/mobile/cashier/orders/[propertyId]` call without adding custom manual filters that might include `pos_completed` orders. The server is now configured to strictly exclude registered orders from this list by default.

### Action 4: Immediate UI Removal
Upon a successful `200 OK` response from the POS registration endpoint, your app should:
1. Remove the order from the local "Pending" state/list.
2. If using a global store (Redux/Zustand), trigger a refresh or manually update the order list.
3. Show a success toast to the user.
