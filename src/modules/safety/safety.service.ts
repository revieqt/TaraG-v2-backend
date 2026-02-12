import nodemailer from 'nodemailer';
import User, { IUser } from '../account/account.model';
import axios from 'axios';
import { EnableSOSRequest, DisableSOSRequest, LocationInfo, Amenity } from './safety.types';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Get location name from latitude and longitude using reverse geocoding
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
const getLocationFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<LocationInfo> => {
  try {
    console.log(`📍 Fetching location for: ${latitude}, ${longitude}`);
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'TaraG-App/1.0'
        },
        timeout: 5000
      }
    );

    const data = response.data;
    const address = data.address || {};

    const locationInfo: LocationInfo = {
      name: data.name || address.road || address.neighbourhood || 'Unknown Location',
      address: data.address?.road || 'Unknown Address',
      city: address.city || address.town || address.village || 'Unknown City',
      country: address.country || 'Unknown Country'
    };

    console.log(`✅ Location fetched:`, locationInfo);
    return locationInfo;
  } catch (error) {
    console.error(`❌ Error fetching location:`, error);
    // Return default location if API fails
    return {
      name: 'Location coordinates provided',
      address: `Latitude: ${latitude}, Longitude: ${longitude}`,
      city: 'Unknown',
      country: 'Unknown'
    };
  }
};

/**
 * Send emergency email to emergency contact
 */
const sendEmergencyEmail = async (
  recipientEmail: string,
  user: IUser,
  emergencyType: string,
  message: string | undefined,
  locationInfo: LocationInfo,
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    console.log(`📧 Sending emergency email to: ${recipientEmail}`);

    const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #d32f2f; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { line-height: 1.6; color: #333; }
            .info-section { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #d32f2f; margin-bottom: 15px; border-radius: 4px; }
            .info-section h3 { margin-top: 0; color: #d32f2f; }
            .info-row { margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #555; }
            .map-section { margin: 20px 0; }
            .map-button { display: inline-block; background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 EMERGENCY ALERT</h1>
            </div>

            <div class="content">
              <p><strong>Someone you know has activated their emergency alert on TaraG.</strong></p>

              <div class="info-section">
                <h3>User Information</h3>
                <div class="info-row">
                  <span class="info-label">Name:</span> ${user.fname} ${user.lname || ''}
                </div>
                <div class="info-row">
                  <span class="info-label">Username:</span> @${user.username}
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span> ${user.email}
                </div>
                <div class="info-row">
                  <span class="info-label">Contact:</span> ${user.contactNumber || 'Not provided'}
                </div>
              </div>

              <div class="info-section">
                <h3>Emergency Details</h3>
                <div class="info-row">
                  <span class="info-label">Emergency Type:</span> ${emergencyType}
                </div>
                ${message ? `<div class="info-row"><span class="info-label">Message:</span> ${message}</div>` : ''}
              </div>

              <div class="info-section">
                <h3>📍 Location Information</h3>
                <div class="info-row">
                  <span class="info-label">Place:</span> ${locationInfo.name}
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span> ${locationInfo.address}
                </div>
                <div class="info-row">
                  <span class="info-label">City:</span> ${locationInfo.city}, ${locationInfo.country}
                </div>
                <div class="info-row">
                  <span class="info-label">Coordinates:</span> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}
                </div>
              </div>

              <div class="map-section">
                <p style="text-align: center; margin-bottom: 10px;"><strong>View the exact location on map:</strong></p>
                <p style="text-align: center;">
                  <a href="${mapUrl}" class="map-button">Open in Google Maps</a>
                </p>
              </div>

              <p style="color: #d32f2f; font-weight: bold;">⚠️ This is an automated emergency alert. Please respond immediately if you can help.</p>
            </div>

            <div class="footer">
              <p>TaraG Emergency Alert System</p>
              <p>If you received this email by mistake, please ignore it.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `🚨 EMERGENCY ALERT: ${emergencyType} - ${user.fname} ${user.lname || ''}`,
      html: emailHtml,
      replyTo: user.email
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Emergency email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error(`❌ Error sending emergency email:`, error);
    throw error;
  }
};

/**
 * Enable SOS/Emergency mode for user
 * Updates user's safetyState and sends email to emergency contact if provided
 */
export const enableSOS = async (req: EnableSOSRequest): Promise<any> => {
  try {
    const { userID, emergencyType, message, emergencyContact, latitude, longitude } = req;

    console.log(`🚨 enableSOS - userId: ${userID}, emergencyType: ${emergencyType}`);

    // Validate required fields
    if (!userID || !emergencyType) {
      throw new Error('User ID and Emergency Type are required');
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Valid latitude and longitude coordinates are required');
    }

    // Find user
    const user = await User.findById(userID);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user's safetyState
    user.safetyState.isInAnEmergency = true;
    user.safetyState.emergencyType = emergencyType;
    // NOTE: Do NOT update emergencyContact - it should only be changed via dedicated endpoint
    
    await user.save();
    console.log(`✅ User safetyState updated - isInAnEmergency: true`);

    // Get location information
    const locationInfo = await getLocationFromCoordinates(latitude, longitude);

    // Send email if emergency contact is provided
    if (emergencyContact && emergencyContact.trim()) {
      try {
        await sendEmergencyEmail(
          emergencyContact,
          user,
          emergencyType,
          message,
          locationInfo,
          latitude,
          longitude
        );
        console.log(`✅ Emergency alert sent to emergency contact`);
      } catch (emailError) {
        console.error(`⚠️ Failed to send emergency email, but SOS is still active:`, emailError);
        // Don't throw - SOS should be active even if email fails
      }
    } else {
      console.log(`ℹ️ No emergency contact provided - email not sent`);
    }

    // Return updated user safetyState
    return {
      isInAnEmergency: user.safetyState.isInAnEmergency,
      emergencyType: user.safetyState.emergencyType,
      emergencyContact: user.safetyState.emergencyContact,
      locationInfo,
      message: 'SOS activated successfully'
    };
  } catch (error) {
    console.error(`❌ Error enabling SOS:`, error);
    throw error;
  }
};

/**
 * Disable SOS/Emergency mode for user
 * Updates user's safetyState to disable emergency mode
 */
export const disableSOS = async (req: DisableSOSRequest): Promise<any> => {
  try {
    const { userID } = req;

    console.log(`✅ disableSOS - userId: ${userID}`);

    // Validate required fields
    if (!userID) {
      throw new Error('User ID is required');
    }

    // Find user
    const user = await User.findById(userID);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user's safetyState
    user.safetyState.isInAnEmergency = false;
    user.safetyState.emergencyType = '';
    // NOTE: Do NOT update emergencyContact
    
    await user.save();
    console.log(`✅ User safetyState updated - isInAnEmergency: false`);

    // Return updated user safetyState
    return {
      isInAnEmergency: user.safetyState.isInAnEmergency,
      emergencyType: user.safetyState.emergencyType,
      emergencyContact: user.safetyState.emergencyContact,
      message: 'SOS deactivated successfully'
    };
  } catch (error) {
    console.error(`❌ Error disabling SOS:`, error);
    throw error;
  }
};

export async function findNearestAmenity(
  amenity?: string,
  latitude?: number,
  longitude?: number,
  tourism?: string,
  aeroway?: string
): Promise<Amenity[]> {
  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required');
  }

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  let queryConditions = '';
  if (amenity) {
    queryConditions = `["amenity"="${amenity}"]`;
  } else if (tourism) {
    queryConditions = `["tourism"="${tourism}"]`;
  } else if (aeroway) {
    queryConditions = `["aeroway"="${aeroway}"]`;
  } else {
    throw new Error('At least one of amenity, tourism, or aeroway must be provided');
  }

  const query = `
    [out:json][timeout:25];
    (
      node${queryConditions}(around:5000,${latitude},${longitude});
      way${queryConditions}(around:5000,${latitude},${longitude});
      relation${queryConditions}(around:5000,${latitude},${longitude});
    );
    out center tags;
  `;

  const response = await axios.post(overpassUrl, query, {
    headers: { 'Content-Type': 'text/plain' }
  });

  const elements = response.data.elements || [];
  return elements.map((el: any) => {
    const category = amenity || tourism || aeroway || 'location';
    return {
      id: el.id?.toString(),
      name: el.tags?.name || `Unknown ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      latitude: el.lat || el.center?.lat,
      longitude: el.lon || el.center?.lon,
      address:
        el.tags?.['addr:full'] ||
        `${el.tags?.['addr:street'] || ''} ${el.tags?.['addr:city'] || ''}`.trim(),
      phone: el.tags?.phone || el.tags?.contact_phone || null,
      website: el.tags?.website || el.tags?.contact_website || null,
    };
  });
}