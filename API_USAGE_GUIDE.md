# API Implementation Guide (Best Practices)

This guide covers how to properly fetch data from the Zamora API, handle errors, and ensure data integrity on the client side (React Native / Mobile).

## 1. Correct Endpoint Usage

### Fetching Rooms
**Endpoint:** `GET https://zamoraapp.com/api/mobile/rooms/[PROPERTY_ID]`

**Correct Implementation:**
```typescript
const fetchRooms = async (propertyId: string) => {
  try {
    const response = await fetch(`https://zamoraapp.com/api/mobile/rooms/${propertyId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error:", data.error);
      return [];
    }
    
    // Check if rooms exist
    if (!data.rooms || data.rooms.length === 0) {
      console.log("No rooms found for this property.");
      return [];
    }

    return data.rooms;
  } catch (error) {
    console.error("Network Error:", error);
    return [];
  }
};
```

---

## 2. Handling "No Rooms Available"

If the API returns an empty array `[]`, it means:
1.  **No Room Types Created:** The property owner has not created any room types in the dashboard.
2.  **Wrong Property ID:** The app might be sending a Property ID for a different hotel or an invalid UUID.

**Debugging Steps:**
1.  **Check the Property ID:** Log the `propertyId` being sent.
    ```javascript
    console.log("Fetching rooms for Property ID:", propertyId);
    ```
2.  **Verify Data in Dashboard:** Go to the Zamora Web Dashboard -> Rooms. If it's empty there, the API is correct to return nothing.

---

## 3. Data Safety & Fallbacks

The API now guarantees certain fields, but you should always handle missing data gracefully.

**Room Object Structure:**
```typescript
interface Room {
  id: string;
  name: string;
  price: number; // Guaranteed (mapped from base_price)
  image: string | null; // Guaranteed (mapped from image_url or gallery)
  capacity: number;
}
```

**Rendering Example (React Native):**
```tsx
<FlatList
  data={rooms}
  renderItem={({ item }) => (
    <View>
      <Image 
        source={{ uri: item.image || 'https://placehold.co/600x400/png?text=No+Image' }} 
        style={{ width: 100, height: 100 }} 
      />
      <Text>{item.name}</Text>
      <Text>{item.price > 0 ? `K${item.price}` : 'Price on Request'}</Text>
    </View>
  )}
/>
```

---

## 4. Common Pitfalls

### ❌ Hardcoding URLs
Don't use `localhost` on a real device. Use your computer's IP or the production URL.
*   **Bad:** `fetch('http://localhost:3000/api/...')`
*   **Good:** `fetch('https://zamoraapp.com/api/...')`

### ❌ Ignoring HTTP Status Codes
Just checking `response.json()` isn't enough. Always check `response.ok` first.
*   **Why?** A 404 or 500 error returns HTML or a generic error object, which might crash your JSON parser or app logic.

### ❌ Assuming Arrays are always populated
Always check `.length > 0` before trying to access `data.rooms[0]`.

---

## 5. Troubleshooting Checklist

1.  **Is the backend running?** (If local)
2.  **Is the Property ID correct?** (Check `console.log`)
3.  **Are there rooms in the DB?** (Ask the property owner)
4.  **Is the network request blocked?** (Check AndroidManifest / Info.plist for HTTP permissions if not using HTTPS)
