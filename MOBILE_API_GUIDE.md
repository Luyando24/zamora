
---

## 6. Waiter API

These endpoints are designed for the **Waiter / Staff App**.

### 6.1 Fetch Waiter's Orders (My Orders)
Retrieves all orders (Food & Bar) for a specific property. Can be filtered by waiter name to show only orders submitted by that waiter.

- **Endpoint**: `/api/mobile/orders/[propertyId]`
- **Method**: `GET`
- **Params**:
  - `propertyId`: UUID of the property (in URL).
  - `waiterName`: (Query Param) Name of the waiter to filter by (e.g., `?waiterName=John`).
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
      "order_items": [
        {
           "id": "item-uuid",
           "quantity": 1,
           "item_name": "Burger",
           "unit_price": 150,
           "total_price": 150
        }
      ]
    }
  ]
}
```

### 6.2 Fetch New Orders (Pending)
Retrieves all **pending** orders (Food & Bar) for a specific property. This is useful for seeing new orders coming in from guests (QR code scans) or other waiters.

- **Endpoint**: `/api/mobile/orders/new/[propertyId]`
- **Method**: `GET`
- **Params**:
  - `propertyId`: UUID of the property (in URL).
- **Auth**: Public (relies on property ID).

**Response:**
Returns a JSON object with a list of **pending** orders, sorted by newest first.

```json
{
  "orders": [
    {
      "id": "order-uuid",
      "type": "food",
      "status": "pending",
      "total_amount": 200,
      "guest_room_number": "Room 101",
      "created_at": "...",
      "order_items": [ ... ]
    }
  ]
}
```
