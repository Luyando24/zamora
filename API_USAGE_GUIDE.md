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

---

## 6. Creating Room Bookings

To create a reservation, you must send a POST request with the guest details and dates.

**Endpoint:** `POST https://zamoraapp.com/api/bookings`

### Request Body
```json
{
  "propertyId": "uuid-of-property",
  "roomTypeId": "uuid-of-room-type",
  "checkIn": "2025-01-20",
  "checkOut": "2025-01-25",
  "guestDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+260970000000"
  }
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "booking": {
    "id": "generated-booking-uuid",
    "status": "confirmed",
    "check_in_date": "2025-01-20",
    "check_out_date": "2025-01-25",
    "total_amount": null 
  }
}
```
*Note: `total_amount` might be null initially if not calculated by the backend immediately. You should calculate the estimated total on the client side (Price * Nights).*

### Error Responses
*   **400 Bad Request:** Missing fields.
*   **404 Not Found:** `No rooms of this type found`.
*   **409 Conflict:** `No rooms available for these dates` (All rooms of this type are fully booked).
*   **500 Internal Server Error:** Backend failure.

### Implementation Example
```typescript
const createBooking = async (bookingDetails) => {
  try {
    const response = await fetch('https://zamoraapp.com/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingDetails),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific errors
      if (response.status === 409) {
        alert("Sorry, no rooms are available for these dates.");
      } else {
        alert(data.error || "Booking failed.");
      }
      return null;
    }

    return data.booking;
  } catch (error) {
    console.error("Booking Request Error:", error);
    alert("Network error. Please try again.");
    return null;
  }
};
```
