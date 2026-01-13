# Mobile Checkout API Guide

## Overview

This guide details the API updates for the mobile app checkout process, specifically addressing:
1.  **Authentication Enforcement**: Mandatory login for food orders at restaurant properties.
2.  **Delivery Options**: Support for 3rd party delivery services (YANGO, BWANGU).
3.  **Order Categories**: Distinguishing between standard, delivery, and pickup orders.
4.  **Gift Orders**: Ability to send orders as gifts with recipient details.
5.  **Payment Methods**: Capturing payment method details.

## API Endpoint

**POST** `/api/mobile/orders`

### Authentication Rules

*   **Restaurant Properties**: If the property type is `restaurant` and the order contains items in `foodCart`, the user **MUST** be authenticated.
    *   **Header**: `Authorization: Bearer <access_token>`
    *   **Response (401)**: If not logged in, returns `{ error: 'Authentication required', details: 'You must be logged in to place a food order at this restaurant.' }`.
*   **Other Properties / Bar Orders**: Authentication is optional but recommended to track the `user_id`.

### Request Payload

The request body should include the following new fields within the `formData` object.

```json
{
  "propertyId": "uuid-string",
  "foodCart": [ ... ],
  "barCart": [ ... ],
  "formData": {
    "name": "Guest Name",
    "phone": "Guest Phone",
    "roomNumber": "Room 101", // or Table Number
    "tableNumber": "5",       // specific table number if applicable
    "paymentMethod": "CASH" | "CARD" | "MOBILE_MONEY",
    "notes": "Extra spicy",
    
    // --- NEW FIELDS ---
    
    // 1. Delivery Option (Optional)
    // Required if orderCategory is 'delivery'
    "deliveryOption": "YANGO" | "BWANGU" | null,

    // 2. Order Category (Optional, default: 'standard')
    // 'standard' = In-house / Room Service
    // 'delivery' = 3rd party delivery
    // 'pickup'   = Customer pickup
    "orderCategory": "standard" | "delivery" | "pickup",

    // 3. Gift Option (Optional, default: false)
    "isGift": true | false,
    
    // 4. Recipient Details (Required if isGift is true)
    "recipientName": "Receiver Name",
    "recipientPhone": "Receiver Phone",
    "recipientAddress": "Receiver Address" // Important for delivery gifts
  }
}
```

### Database Schema Updates

The following columns have been added to `orders` and `bar_orders` tables:

| Column | Type | Description |
| :--- | :--- | :--- |
| `delivery_option` | `TEXT` | Provider name (e.g., 'YANGO') |
| `order_category` | `TEXT` | 'standard', 'delivery', etc. |
| `is_gift` | `BOOLEAN` | True if this is a gift order |
| `recipient_name` | `TEXT` | Name of the gift receiver |
| `recipient_phone` | `TEXT` | Phone of the gift receiver |
| `recipient_address` | `TEXT` | Address for delivery/gift |
| `user_id` | `UUID` | Links to `auth.users` if logged in |

### Example Request

```bash
curl -X POST https://your-domain.com/api/mobile/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{
    "propertyId": "123e4567-e89b-12d3-a456-426614174000",
    "foodCart": [
      { "id": 1, "quantity": 2, "price": 150, "name": "Burger" }
    ],
    "formData": {
      "name": "John Doe",
      "phone": "+260970000000",
      "paymentMethod": "MOBILE_MONEY",
      "orderCategory": "delivery",
      "deliveryOption": "YANGO",
      "isGift": true,
      "recipientName": "Jane Doe",
      "recipientPhone": "+260960000000",
      "recipientAddress": "Plot 123, Great East Road"
    }
  }'
```

## Implementation Checklist

1.  [x] Create Database Migration (`20260113120000_add_delivery_and_gift_fields.sql`)
2.  [x] Update API Logic (`app/api/mobile/orders/route.ts`) to extract and save new fields.
3.  [x] Implement Auth Check for Restaurant Food Orders.
4.  [ ] (Frontend) Update Checkout Form to include Delivery/Gift toggles.
5.  [ ] (Frontend) Pass `Authorization` header in API calls.
