# Safety API Documentation

## Overview
The Safety API provides endpoints for users to activate and deactivate emergency SOS mode. When SOS is activated, the system updates the user's safety state and can send emergency alerts to a designated contact via email.

## Features
- **Emergency Activation**: Enable SOS mode with emergency type and location
- **Email Alerts**: Automatically sends emergency notification with user details and location map
- **Location Mapping**: Reverse geocodes coordinates to provide location details
- **Emergency Deactivation**: Safely disable emergency mode when no longer needed

---

## Endpoints

### 1. Enable SOS (Emergency Activation)

**Endpoint:** `POST /api/safety/enable-sos`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userID": "507f1f77bcf86cd799439011",
  "emergencyType": "Medical Emergency",
  "message": "I'm having chest pain",
  "emergencyContact": "contact@example.com",
  "latitude": 10.3157,
  "longitude": 123.8854
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userID` | string | Yes | The user ID from SessionContext |
| `emergencyType` | string | Yes | Type of emergency (e.g., "Medical", "Accident", "Threat", etc.) |
| `message` | string | No | Additional message about the emergency |
| `emergencyContact` | string | No | Email address of the emergency contact to receive alert |
| `latitude` | number | Yes | Current latitude coordinate (decimal) |
| `longitude` | number | Yes | Current longitude coordinate (decimal) |

**Response (Success - 200):**
```json
{
  "message": "SOS activated successfully",
  "data": {
    "isInAnEmergency": true,
    "emergencyType": "Medical Emergency",
    "emergencyContact": "contact@example.com",
    "locationInfo": {
      "name": "Ayala Shopping Center",
      "address": "Kalabaw Street",
      "city": "Cebu",
      "country": "Philippines"
    }
  }
}
```

**Response (Error - 400/500):**
```json
{
  "message": "Error description"
}
```

**Error Codes:**
- `400`: Missing or invalid required fields
- `401`: Invalid or missing authentication token
- `500`: Server error

**What Happens:**
1. Validates all required fields
2. Finds the user by ID
3. Updates user's `safetyState`:
   - Sets `isInAnEmergency: true`
   - Sets `emergencyType` to provided value
   - **Does NOT** update `emergencyContact` (preserved from user profile)
4. Reverse geocodes coordinates to get location name/address using OpenStreetMap API
5. If emergency contact is provided:
   - Sends formatted HTML email with:
     - User's name, username, email, contact number
     - Emergency type and message (if provided)
     - Location details (name, address, city, country)
     - Clickable Google Maps link to exact coordinates
   - Email includes professional styling and clear visual hierarchy
6. Returns updated safety state and location information

**Note:** If email sending fails, SOS remains active and request succeeds (email is non-critical).

---

### 2. Disable SOS (Emergency Deactivation)

**Endpoint:** `POST /api/safety/disable-sos`

**Authentication:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userID": "507f1f77bcf86cd799439011"
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userID` | string | Yes | The user ID from SessionContext |

**Response (Success - 200):**
```json
{
  "message": "SOS deactivated successfully",
  "data": {
    "isInAnEmergency": false,
    "emergencyType": "",
    "emergencyContact": "contact@example.com"
  }
}
```

**Response (Error - 400/500):**
```json
{
  "message": "Error description"
}
```

**Error Codes:**
- `400`: Missing or invalid required fields
- `401`: Invalid or missing authentication token
- `500`: Server error

**What Happens:**
1. Validates required fields
2. Finds the user by ID
3. Updates user's `safetyState`:
   - Sets `isInAnEmergency: false`
   - Clears `emergencyType` to empty string
   - **Does NOT** update `emergencyContact` (preserved from user profile)
4. Returns updated safety state

---

## Email Notification Format

When an emergency contact email is sent, it includes:

### Email Header
- 🚨 EMERGENCY ALERT in red banner

### User Information Section
- Full name
- Username
- Email address
- Contact number

### Emergency Details Section
- Emergency type
- Optional message from user

### Location Section
- Place name (from reverse geocoding)
- Street address
- City and country
- Exact latitude/longitude coordinates
- **Clickable Google Maps button** to view exact location

### Call-to-Action
- Clear warning message
- Instruction to respond immediately if able to help

---

## User Model Integration

The `safetyState` field in the User model has the following structure:

```typescript
safetyState: {
  isInAnEmergency: boolean;      // Whether user is currently in emergency
  emergencyType: string;          // Type of emergency (can be empty string)
  emergencyContact?: string;      // Email for emergency notifications (user-managed)
}
```

**Important:**
- `emergencyContact` should only be updated through the dedicated user profile endpoint
- `enableSOS` and `disableSOS` will NOT modify `emergencyContact`
- The emergency contact must be set separately (e.g., from the Safety/SOS screen in the app)

---

## Location Service

The API uses OpenStreetMap's **Nominatim API** for reverse geocoding:

**Features:**
- Free service (no API key required)
- Converts latitude/longitude to human-readable addresses
- Returns place name, street address, city, and country
- Timeout: 5 seconds
- Fallback: Returns coordinate-based location if service fails

**Supported Regions:** Worldwide

---

## Frontend Integration Example

```typescript
// Pseudo-code for frontend integration

// Enable SOS
const handleEnableSOS = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/safety/enable-sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        userID: session.user.id,
        emergencyType: selectedEmergencyType,
        message: userMessage,
        emergencyContact: session.user.safetyState?.emergencyContact,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    // Update UI with location info
    console.log('SOS activated at:', data.data.locationInfo);
  } catch (error) {
    console.error('Failed to activate SOS:', error);
  }
};

// Disable SOS
const handleDisableSOS = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/safety/disable-sos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        userID: session.user.id
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    console.log('SOS deactivated');
  } catch (error) {
    console.error('Failed to deactivate SOS:', error);
  }
};
```

---

## Environment Variables

Required environment variables in `.env`:

```
EMAIL_USER=your_gmail@gmail.com          # Gmail account for sending emails
EMAIL_PASSWORD=your_app_password         # Gmail app password (2FA required)
JWT_SECRET=your_secret_key               # For token verification
```

**Email Setup:**
1. Enable 2-Factor Authentication on Gmail
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `EMAIL_PASSWORD`

---

## Error Handling

**Common Errors:**

| Scenario | Status | Message | Cause |
|----------|--------|---------|-------|
| Missing token | 401 | "Access denied. No token provided." | No Authorization header |
| Invalid token | 403 | "Invalid or expired token." | Expired or malformed token |
| Missing userID | 400 | "User ID is required" | Required field missing |
| User not found | 500 | "User not found" | Invalid userID |
| Invalid coordinates | 400 | "Valid latitude and longitude are required" | Coordinates not numbers |

---

## Best Practices

1. **Always provide coordinates**: Even if email isn't sent, coordinates are essential for location services
2. **Emergency contact email validation**: Validate email format on frontend before sending
3. **Token refresh**: Ensure access token is fresh before making requests
4. **Error handling**: Always catch and display errors to user
5. **Location tracking**: Consider using device geolocation APIs (React Native: `@react-native-camera-roll/camera-roll`)
6. **UX considerations**: 
   - Allow 2-3 seconds delay before auto-disabling SOS
   - Show loading state while coordinates are being fetched
   - Confirm SOS activation/deactivation to user

---

## Testing

**Sample cURL Commands:**

```bash
# Enable SOS
curl -X POST http://localhost:5000/api/safety/enable-sos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "507f1f77bcf86cd799439011",
    "emergencyType": "Medical",
    "message": "Need help",
    "emergencyContact": "contact@example.com",
    "latitude": 10.3157,
    "longitude": 123.8854
  }'

# Disable SOS
curl -X POST http://localhost:5000/api/safety/disable-sos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "507f1f77bcf86cd799439011"
  }'
```

---

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify all required fields are provided
3. Ensure email credentials are correctly configured
4. Check network connectivity for geolocation API calls
