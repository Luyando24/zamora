# Stock Management Mobile and Desktop API Guide

This guide provides all the necessary API endpoints and instructions for implementing stock management functionality in the mobile and desktop app. These endpoints are designed for managers and authorized staff to track inventory, perform restocks, and monitor stock levels.

## Base URL

All endpoints are relative to your base URL:
```
https://zamoraapp.com/api/mobile/manager/stock
```

## Authentication

All endpoints require a valid Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

The user must have one of the following roles: `admin`, `manager`, `owner`, `staff`, `chef`, `bartender`, or `super_admin`.

---

## 1. List Inventory Items

Retrieve all inventory items for a property with optional filtering.

**Endpoint:** `GET /api/mobile/manager/stock`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string (UUID) | Yes | The property to fetch inventory for |
| `category` | string | No | Filter by category: `food`, `beverage`, `cleaning`, `amenity`, `other` |
| `lowStockOnly` | boolean | No | Set to `true` to return only low-stock items |
| `search` | string | No | Search items by name |

**Response Example:**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid-1",
      "name": "Rice",
      "sku": "RICE001",
      "category": "food",
      "unit": "kg",
      "quantity": 25,
      "min_quantity": 10,
      "cost_per_unit": 15.00,
      "location": "kitchen",
      "supplier_id": "supplier-uuid",
      "supplier_name": "ABC Suppliers",
      "is_low_stock": false,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-20T14:30:00Z"
    }
  ],
  "summary": {
    "total_items": 45,
    "low_stock_count": 3,
    "total_inventory_value": 15420.50
  }
}
```

---

## 2. Get Single Item Details

Retrieve detailed information about a single inventory item including recent transactions.

**Endpoint:** `GET /api/mobile/manager/stock/[itemId]`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string (UUID) | Yes | The property ID |

**Response Example:**
```json
{
  "success": true,
  "item": {
    "id": "uuid-1",
    "name": "Rice",
    "sku": "RICE001",
    "category": "food",
    "unit": "kg",
    "quantity": 25,
    "min_quantity": 10,
    "cost_per_unit": 15.00,
    "location": "kitchen",
    "supplier_id": "supplier-uuid",
    "supplier_name": "ABC Suppliers",
    "is_low_stock": false
  },
  "transactions": [
    {
      "id": "txn-uuid-1",
      "type": "in",
      "quantity": 50,
      "reason": "Weekly restock",
      "cost_at_time": 15.00,
      "performed_by": "user-uuid",
      "created_at": "2024-01-20T10:00:00Z"
    },
    {
      "id": "txn-uuid-2",
      "type": "out",
      "quantity": -25,
      "reason": "Order 12345678 completed",
      "cost_at_time": 15.00,
      "performed_by": null,
      "created_at": "2024-01-21T15:30:00Z"
    }
  ]
}
```

---

## 3. Update Inventory Item

Update the properties of an inventory item (not the quantity - use transactions for that).

**Endpoint:** `PUT /api/mobile/manager/stock/[itemId]`

**Request Body:**
```json
{
  "propertyId": "property-uuid",
  "name": "Basmati Rice",
  "category": "food",
  "unit": "kg",
  "min_quantity": 15,
  "cost_per_unit": 18.00,
  "location": "main_storage",
  "supplier_id": "new-supplier-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "uuid-1",
    "name": "Basmati Rice",
    "category": "food",
    "unit": "kg",
    "quantity": 25,
    "min_quantity": 15,
    "cost_per_unit": 18.00,
    "updated_at": "2024-01-22T10:00:00Z"
  }
}
```

---

## 4. Create Stock Transaction (Restock / Adjust / Waste)

Record a stock movement. This is the primary way to adjust inventory levels.

**Endpoint:** `POST /api/mobile/manager/stock/transactions`

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | string | Yes | The property ID |
| `itemId` | string | Yes | The inventory item ID |
| `type` | string | Yes | One of: `in`, `out`, `adjustment`, `waste` |
| `quantity` | number | Yes | Positive number (see notes below) |
| `reason` | string | No | Description of why this change was made |
| `costAtTime` | number | No | Cost per unit at time of transaction |

**Transaction Types:**
- `in`: Add stock (restock). Quantity is added.
- `out`: Remove stock (manual deduction). Quantity is subtracted.
- `adjustment`: Set to exact quantity. Useful for stock counts.
- `waste`: Remove due to spoilage/expiry. Quantity is subtracted.

**Example - Restock:**
```json
{
  "propertyId": "property-uuid",
  "itemId": "item-uuid",
  "type": "in",
  "quantity": 50,
  "reason": "Weekly delivery from ABC Suppliers"
}
```

**Example - Stock Adjustment (Count Correction):**
```json
{
  "propertyId": "property-uuid",
  "itemId": "item-uuid",
  "type": "adjustment",
  "quantity": 42,
  "reason": "Physical stock count"
}
```

**Example - Record Waste:**
```json
{
  "propertyId": "property-uuid",
  "itemId": "item-uuid",
  "type": "waste",
  "quantity": 5,
  "reason": "Expired/spoiled"
}
```

**Response:**
```json
{
  "success": true,
  "item_name": "Rice",
  "previous_quantity": 25,
  "new_quantity": 75,
  "quantity_change": 50,
  "transaction_id": "txn-uuid"
}
```

---

## 5. List Transactions

Retrieve transaction history for a property or specific item.

**Endpoint:** `GET /api/mobile/manager/stock/transactions`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string | Yes | The property ID |
| `itemId` | string | No | Filter by specific item |
| `type` | string | No | Filter by type: `in`, `out`, `adjustment`, `waste` |
| `limit` | number | No | Max results (default: 50) |

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "txn-uuid",
      "type": "in",
      "quantity": 50,
      "reason": "Weekly restock",
      "cost_at_time": 15.00,
      "performed_by": "user-uuid",
      "created_at": "2024-01-20T10:00:00Z",
      "item_id": "item-uuid",
      "item_name": "Rice"
    }
  ]
}
```

---

## 6. Low Stock Alerts

Get a list of all items that are below their minimum stock threshold.

**Endpoint:** `GET /api/mobile/manager/stock/low-stock`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string | Yes | The property ID |

**Response:**
```json
{
  "success": true,
  "count": 3,
  "alert_message": "3 item(s) need restocking",
  "items": [
    {
      "id": "item-uuid",
      "name": "Cooking Oil",
      "category": "food",
      "unit": "L",
      "current_quantity": 2,
      "min_quantity": 10,
      "shortage": 8,
      "cost_per_unit": 25.00,
      "supplier_name": "ABC Suppliers",
      "urgency": "critical"
    },
    {
      "id": "item-uuid-2",
      "name": "Salt",
      "category": "food",
      "unit": "kg",
      "current_quantity": 3,
      "min_quantity": 5,
      "shortage": 2,
      "cost_per_unit": 5.00,
      "supplier_name": null,
      "urgency": "medium"
    }
  ]
}
```

**Urgency Levels:**
- `critical`: Stock is at 0
- `high`: Stock is at or below 50% of minimum
- `medium`: Stock is at or below minimum

---

## 7. Stock Snapshots (Opening Stock)

Take and retrieve inventory snapshots. Use this to record opening stock at the beginning of the day, week, or month.

### Take a Snapshot

**Endpoint:** `POST /api/mobile/manager/stock/snapshot`

**Request Body:**
```json
{
  "propertyId": "property-uuid",
  "snapshotType": "daily",
  "notes": "Monday opening stock"
}
```

**Snapshot Types:**
- `daily`: Beginning of day snapshot
- `weekly`: Beginning of week snapshot
- `monthly`: Beginning of month snapshot

**Response:**
```json
{
  "success": true,
  "snapshot_id": "snapshot-uuid",
  "message": "Daily snapshot created successfully",
  "snapshot_date": "2024-01-22"
}
```

> **Note:** Only one snapshot of each type can exist per day per property. Taking a new snapshot will overwrite any existing snapshot of the same type for that day.

### List Snapshots

**Endpoint:** `GET /api/mobile/manager/stock/snapshot`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `propertyId` | string | Yes | The property ID |
| `type` | string | No | Filter by type: `daily`, `weekly`, `monthly` |
| `startDate` | string | No | Filter from date (YYYY-MM-DD) |
| `endDate` | string | No | Filter to date (YYYY-MM-DD) |
| `limit` | number | No | Max results (default: 30) |

**Response:**
```json
{
  "success": true,
  "snapshots": [
    {
      "id": "snapshot-uuid",
      "snapshot_type": "daily",
      "snapshot_date": "2024-01-22",
      "total_value": 15420.50,
      "item_count": 45,
      "notes": "Monday opening stock",
      "created_at": "2024-01-22T06:00:00Z"
    }
  ]
}
```

---

## Implementation Guide

### Recommended Workflow for Stock Management

1. **Dashboard View**
   - Call `GET /api/mobile/manager/stock/low-stock` on app open to check for alerts
   - Display badge with count if `count > 0`
   - Call `GET /api/mobile/manager/stock` to show full inventory list

2. **Restock Flow**
   - User selects item to restock
   - User enters quantity received
   - Call `POST /api/mobile/manager/stock/transactions` with `type: "in"`

3. **Stock Count / Adjustment**
   - Manager performs physical count
   - For each item where count differs from system:
   - Call `POST /api/mobile/manager/stock/transactions` with `type: "adjustment"`

4. **Daily Opening Stock**
   - At beginning of shift, manager takes a daily snapshot
   - Call `POST /api/mobile/manager/stock/snapshot` with `snapshotType: "daily"`
   - This creates an audit record of opening stock

5. **Waste Recording**
   - When items are spoiled/expired:
   - Call `POST /api/mobile/manager/stock/transactions` with `type: "waste"`

### Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad request (missing required fields)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (user lacks permission)
- `404`: Resource not found
- `500`: Server error

### Automatic Stock Deduction

Stock is automatically deducted when orders are completed (`pos_completed` status). This happens based on recipes configured in the system. No additional API calls are needed for sales deductions.

---

## Testing

Use these example requests to test your implementation:

### List All Items
```bash
curl -X GET "https://your-domain.com/api/mobile/manager/stock?propertyId=YOUR_PROPERTY_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Quick Restock
```bash
curl -X POST "https://your-domain.com/api/mobile/manager/stock/transactions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"YOUR_PROPERTY_ID","itemId":"ITEM_ID","type":"in","quantity":100,"reason":"Supplier delivery"}'
```

### Take Daily Snapshot
```bash
curl -X POST "https://your-domain.com/api/mobile/manager/stock/snapshot" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"propertyId":"YOUR_PROPERTY_ID","snapshotType":"daily"}'
```

---

## Questions?

If you have any questions about implementing stock management in the mobile app, please refer to the existing API guides (CHEF_MOBILE_API_GUIDE.md, CASHIER_MOBILE_API_GUIDE.md) for patterns and conventions used in this project.
