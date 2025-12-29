# Mobile App WhatsApp Booking Implementation Guide

This guide explains how to implement the "Book via WhatsApp" feature in the mobile application, matching the web implementation.

## 1. API Update
The property details and rooms endpoints have been updated to return the `whatsapp_booking_phone` field.

**Endpoint 1:** `GET /api/mobile/properties/[propertyId]`

**Response Example:**
```json
{
  "property": {
    "name": "The Royal Hotel",
    "logo_url": "...",
    "currency_symbol": "K",
    "type": "hotel",
    "whatsapp_booking_phone": "+260970000000" // Nullable
  }
}
```

**Endpoint 2:** `GET /api/mobile/rooms/[propertyId]`

**Response Example:**
```json
{
  "rooms": [
    {
      "id": "...",
      "name": "Deluxe Room",
      "price": 100,
      "image": "...",
      "whatsapp_booking_phone": "+260970000000" // Included in each room object
    }
  ],
  "whatsapp_booking_phone": "+260970000000" // Also at root level
}
```

## 2. Implementation Logic

When a user views a room and wants to book, check if `property.whatsapp_booking_phone` exists.

### Condition:
- **IF** `whatsapp_booking_phone` is present:
  - Hide the standard "Add to Cart" or "Reserve" button.
  - Show a **"Book via WhatsApp"** button (Green color recommended: `#25D366`).
- **ELSE**:
  - Show the standard booking flow.

## 3. WhatsApp Message Construction

When the button is clicked, construct a pre-filled message with the booking details.

**Required Data:**
- Property Name
- Room Name
- Check-in Date (formatted, e.g., "20 Jan 2025")
- Check-out Date (formatted)
- Number of Nights
- Number of Guests
- Total Price

**Message Template:**
```text
Hello, I found this on Zamora and I'm interested in booking the [Room Name] at [Property Name].

Is this room available for booking from [Check-in] to [Check-out] ([Nights] nights)?

Details:
- Guests: [Guests]
- Total Price: K[Total Price]

Looking forward to your response!
```

## 4. Launching WhatsApp

1. **Clean the Phone Number:** Remove all non-numeric characters from `whatsapp_booking_phone` (e.g., `+260 97...` -> `26097...`).
2. **Encode the Message:** URL-encode the message template.
3. **Open URL:**
   ```javascript
   const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
   Linking.openURL(whatsappUrl); // React Native example
   ```

## 5. Example Code (TypeScript/React Native)

```typescript
const handleWhatsAppBook = () => {
  if (!checkIn || !checkOut) {
    Alert.alert('Missing Dates', 'Please select check-in and check-out dates.');
    return;
  }

  const cleanPhone = property.whatsapp_booking_phone.replace(/[^0-9]/g, '');
  
  const message = `Hello, I found this on Zamora and I'm interested in booking the ${room.name} at ${property.name}.

Is this room available for booking from ${formatDate(checkIn)} to ${formatDate(checkOut)} (${nights} nights)?

Details:
- Guests: ${guests}
- Total Price: ${property.currency_symbol}${totalPrice}

Looking forward to your response!`;

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  Linking.canOpenURL(url).then(supported => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'WhatsApp is not installed');
    }
  });
};
```
