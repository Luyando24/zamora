# Mobile Bar Menu API Guide

This guide specifically details the behavior and data isolation rules for **Bar Menu Items** within the Mobile API.

**Note**: Bar menu items are returned as part of the main `GET /api/mobile/menu/[propertyId]` endpoint, but they follow specific isolation rules distinct from food items.

## Endpoint Context

**URL**: `/api/mobile/menu/[propertyId]`
**Method**: `GET`

## Bar Menu Data Structure

The API returns bar menu items in the `barMenuItems` array and their categories in `barCategories`.

```json
{
  "property": { ... },
  "menuItems": [ ... ], // Food items
  "barMenuItems": [
    {
      "id": "uuid",
      "name": "Jameson Black Barrel",
      "price": 650,
      "image": "https://...",
      "category": "Whiskey",
      "description": "750ml bottle",
      "is_available": true
    }
  ],
  "barCategories": ["Whiskey", "Gin", "Soft Drinks"]
}
```

## Strict Data Isolation Rules

To prevent "Bar Menu Leakage" (where bar items from one restaurant appear on another), the API enforces the following strict rules:

### 1. Row-Level Property Ownership
Unlike food items which may use junction tables for complex relationships, **Bar Menu Items must have a direct `property_id` assignment** on their database record.

*   **Database Column**: `bar_menu_items.property_id`
*   **Requirement**: This column must match the requested `propertyId`.
*   **Query Logic**:
    ```typescript
    // Strict filtering by the item's direct property_id
    .from('bar_menu_items')
    .select('*')
    .eq('property_id', resolvedPropertyId)
    .eq('is_available', true)
    ```

### 2. No Shared Items
*   A Bar Menu Item cannot be shared between properties.
*   If "Restaurant A" and "Restaurant B" both sell "Coca Cola", they must each have their own unique "Coca Cola" record in the database.
*   This ensures that if Restaurant A changes the price or availability of their Coke, it **does not** affect Restaurant B.

### 3. Dynamic Category Generation
Bar categories (`barCategories`) are derived **only** from the items currently fetched for the property.
*   If a property has no items in the "Wine" category, "Wine" will not appear in the category list, even if it exists in the global system.

## Troubleshooting

### Issue: "Bar items are showing up on the wrong property"
**Cause**: This typically happens if the API relies on a junction table (many-to-many) that contains stale or incorrect links.
**Fix**: 
1.  The system now enforces 1-to-1 ownership.
2.  Ensure the API is using the updated logic (filtering by `property_id` column, NOT junction table).
3.  Verify the item in the database has the correct `property_id` set.

### Issue: "Bar items are missing"
**Cause**: 
1.  The item might not have its `property_id` column set (it might be NULL).
2.  The item might be set to `is_available: false`.
**Fix**:
*   Edit the item in the Dashboard. The "Save" action in the Bar Menu Wizard automatically sets the correct `property_id` and ensures isolation.

### Issue: "Updates not showing on mobile"
**Cause**: Aggressive caching.
**Fix**: 
*   The API sends `Cache-Control: no-store`.
*   App should implement Pull-to-Refresh.
*   Force refresh by appending a timestamp: `/api/mobile/menu/[propertyId]?t=12345`
