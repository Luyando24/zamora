# Mobile App: "From Price" Implementation Guide

This guide details how to implement the "From Price" (starting price) display for property listings in the mobile application.

## 1. API Endpoint

Use the following endpoint to fetch the list of properties:

```http
GET /api/mobile/properties
```

**Response Format:**

The API returns an array of properties. Each property object now includes `min_price` and `currency_symbol`.

```json
{
  "properties": [
    {
      "id": "uuid-string",
      "name": "Zamora Luxury Lodge",
      "currency_symbol": "ZMW",
      "min_price": 1500,
      // ... other fields
    },
    // ...
  ]
}
```

## 2. Logic & Display Rules

The `min_price` field represents the lowest base price among all room types defined for that property.

### Rule A: Valid Price (`min_price > 0`)

If the `min_price` is greater than 0, you **MUST** display the "From" price badge/label.

*   **Format:** `From [Currency Symbol] [Price]`
*   **Example:** `From ZMW 1,500`
*   **Formatting:** Ensure the price is formatted with thousands separators (e.g., `1,500` not `1500`).

### Rule B: No Price (`min_price == 0` or null)

If `min_price` is 0, null, or missing:

*   **Do NOT** display "From 0".
*   **Action:** Hide the price label entirely OR display a generic call-to-action like "View Details".

### Rule C: Currency Fallback

*   Always use the `currency_symbol` provided in the API response.
*   If `currency_symbol` is missing (null), default to **ZMW** (Zambian Kwacha) or hide the symbol, but this should be treated as an edge case.

## 3. UI Implementation Recommendations

*   **Location:** Place the "From Price" label prominently on the property card (e.g., bottom right corner or over the cover image).
*   **Styling:** 
    *   Use a distinct font weight (Bold).
    *   Ensure good contrast against the background (especially if overlaid on an image).
    *   Size: Small but legible (e.g., 12sp or 14sp).

## 4. Code Example (Pseudo-code)

```typescript
// Component: PropertyCard.tsx

const PropertyCard = ({ property }) => {
  const { min_price, currency_symbol } = property;
  
  // Helper to format currency
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const shouldDisplayPrice = min_price && min_price > 0;
  const currency = currency_symbol || 'ZMW';

  return (
    <View style={styles.card}>
       {/* Image, Title, etc. */}
       
       {shouldDisplayPrice && (
         <View style={styles.priceTag}>
           <Text style={styles.fromLabel}>From</Text>
           <Text style={styles.priceValue}>
             {currency} {formatPrice(min_price)}
           </Text>
         </View>
       )}
    </View>
  );
};
```
