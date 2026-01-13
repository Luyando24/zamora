# Mobile Menu API Guide

This guide details the behavior, usage, and troubleshooting for the Mobile Menu API endpoint.

## Endpoint Overview

**URL**: `/api/mobile/menu/[propertyId]`
**Method**: `GET`
**Content-Type**: `application/json`

This endpoint retrieves the Food and Bar menu items for a specific property. It is designed to be consumed by the mobile application and ensures strict data isolation between properties.

## Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `propertyId` | `string` | The **UUID** or **Slug** of the property. Example: `0ea083b5-a35a...` or `dlila-lodge`. |

## Response Structure

The API returns a JSON object with the following structure:

```json
{
  "property": {
    "id": "uuid",
    "name": "Property Name",
    "currency_symbol": "K",
    // ... other property details
  },
  "menuItems": [
    {
      "id": "uuid",
      "name": "T-Bone Steak",
      "price": 150,
      "image": "https://...", // Normalized image URL
      "category": "Mains",
      // ...
    }
  ],
  "barMenuItems": [
    {
      "id": "uuid",
      "name": "Mosi Lager",
      "price": 25,
      "image": "https://...",
      "category": "Beers"
    }
  ],
  "categories": ["Mains", "Starters", "Desserts"], // Food categories
  "barCategories": ["Beers", "Wines", "Spirits"] // Bar categories
}
```

## Data Freshness & Caching

To ensure the mobile app always displays the latest prices and items, this endpoint enforces **strict no-caching policies**.

### Server-Side Headers
The following headers are sent with every response:
*   `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
*   `Pragma: no-cache`
*   `Expires: 0`

These headers instruct the mobile app, intermediate proxies, and CDNs **NOT** to cache the response.

### Client-Side Best Practices (Mobile App)
Even with these headers, mobile networking libraries (like Axios, React Query, or standard `fetch`) may hold onto a local cache.
*   **Pull-to-Refresh**: Ensure the app implements a "Pull to Refresh" mechanism that explicitly ignores the local cache.
*   **Cache Busting**: If issues persist, append a timestamp to the URL:
    `/api/mobile/menu/[propertyId]?t=${Date.now()}`

## Troubleshooting

### Issue 1: "Items are not updating" or "Old prices shown"
**Cause**: The mobile app is serving a locally cached version of the data.
**Solution**: 
1.  Close and reopen the app.
2.  Implement "Pull to Refresh" in the app.
3.  Verify the API is returning fresh data by visiting the URL in a browser (browsers respect the `no-store` header).

### Issue 2: "Fetching data from other properties"
**Cause**: This usually happens if the `propertyId` is not being filtered correctly or if the database query is too permissive (missing `!inner` join).
**Verification**:
Our API uses an **Inner Join** to ensure strict isolation:
```typescript
.select('*, menu_item_properties!inner(property_id)')
.eq('menu_item_properties.property_id', propertyId)
```
This guarantees that **only** items explicitly assigned to the requested Property ID are returned.

### Issue 3: "Blank Menu"
**Cause**: 
*   Invalid `propertyId` (UUID or Slug).
*   No items assigned to the property.
*   Items are marked as `is_available: false`.

## Testing with cURL

You can verify the live API response using cURL:

```bash
# Replace [propertyId] with your actual ID
curl -v "https://zamoraapp.com/api/mobile/menu/[propertyId]"
```

Check the `Cache-Control` header in the response.
