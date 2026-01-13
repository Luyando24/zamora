# Mobile App Implementation Guide: Property Card Location

This guide explains how to display the property location (City/Country) on the Homescreen Property Cards.

## 1. API Data Source

**Endpoint:** `GET /api/mobile/properties`

The property object now includes `city` and `country` fields specifically for card displays.

### JSON Structure
```json
{
  "properties": [
    {
      "id": "...",
      "name": "Zamora Grand",
      "city": "Lusaka",       // <--- USE THIS FOR CARD
      "country": "Zambia",    // <--- USE THIS FOR CARD
      "address": "Plot 123...", // Use this for Details Page only
      "cover_image_url": "...",
      "min_price": 1500
    }
  ]
}
```

## 2. Implementation Logic

1.  **Primary Display**: Use the `city` field.
2.  **Context**: Append `country` if needed (e.g., "Lusaka, Zambia").
3.  **Fallback**: If `city` is missing (null/empty), fall back to `country` or a default string like "Zambia".

## 3. React Native Component Example

Here is a ready-to-use snippet for the Property Card component:

```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface Property {
  id: string;
  name: string;
  city?: string;
  country?: string;
  cover_image_url?: string;
  min_price: number;
}

export const PropertyCard = ({ property, onPress }: { property: Property; onPress: () => void }) => {
  // Logic to format location string
  const locationText = [property.city, property.country]
    .filter(Boolean) // Remove null/undefined/empty strings
    .join(', ');     // Result: "Lusaka, Zambia" or just "Lusaka"

  return (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: 16, borderRadius: 12, backgroundColor: 'white', overflow: 'hidden' }}>
      {/* Image Section */}
      <Image 
        source={{ uri: property.cover_image_url }} 
        style={{ width: '100%', height: 200 }} 
        resizeMode="cover"
      />
      
      {/* Content Section */}
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
          {property.name}
        </Text>
        
        {/* Location Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <MapPin size={14} color="#666" />
          <Text style={{ marginLeft: 4, fontSize: 14, color: '#666' }}>
            {locationText || 'Zambia'} 
          </Text>
        </View>

        {/* Price Section */}
        <Text style={{ marginTop: 8, fontWeight: '600', color: '#2E7D32' }}>
          From K{property.min_price} / night
        </Text>
      </View>
    </TouchableOpacity>
  );
};
```

## 4. Key Notes for Developer
*   **Do not use `address` on the card**: It is usually too long (e.g., "Plot 123, Corner of X and Y..."). Keep the card clean with just the City.
*   **Filter Logic**: If you implement client-side filtering, filter against `property.city`.
