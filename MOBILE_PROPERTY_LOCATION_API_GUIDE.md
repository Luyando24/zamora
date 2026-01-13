# Mobile Property Location API Guide

This guide details how to retrieve property location information (Address, City, Country) using the Zamora Mobile API.

## 1. Fetch All Properties with Location

**Endpoint:** `GET /api/mobile/properties`

Returns a list of all properties including their full address details.

### Request
```http
GET https://zamoraapp.com/api/mobile/properties
```

### Response
```json
{
  "properties": [
    {
      "id": "uuid-string",
      "name": "Zamora Grand Hotel",
      "type": "hotel",
      "address": "Plot 123, Great East Road",
      "city": "Lusaka",
      "country": "Zambia",
      "cover_image_url": "https://...",
      "min_price": 1500,
      // ... other fields
    },
    {
      "id": "uuid-string-2",
      "name": "Sunset Grill",
      "type": "restaurant",
      "address": "45 Independence Avenue",
      "city": "Livingstone",
      "country": "Zambia",
      // ...
    }
  ]
}
```

## 2. Search & Filter by City (Advanced)

For filtering properties by city or address server-side, use the Search RPC (if exposed via API) or filter client-side.

### Client-Side Filtering (Recommended for < 100 properties)
```javascript
const filterByCity = (properties, city) => {
  return properties.filter(p => p.city?.toLowerCase() === city.toLowerCase());
};
```

## 3. Displaying Location Data

When displaying property cards or details on the mobile app, you should prioritize the fields in this order:

1.  **City, Country**: (e.g., "Lusaka, Zambia") - Good for list views.
2.  **Full Address**: (e.g., "Plot 123, Great East Road") - Good for detail views.

### Example React Native Component

```tsx
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

const PropertyLocation = ({ property }) => {
  const locationString = [property.city, property.country]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={{ gap: 4 }}>
      {/* City & Country Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MapPin size={16} color="#666" />
        <Text style={{ color: '#666', marginLeft: 4 }}>
          {locationString || 'Location unavailable'}
        </Text>
      </View>

      {/* Full Address (for details page) */}
      {property.address && (
        <Text style={{ fontSize: 12, color: '#999' }}>
          {property.address}
        </Text>
      )}
    </View>
  );
};
```
