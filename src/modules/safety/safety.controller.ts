import { Request, Response } from 'express';
import { enableSOS, disableSOS, findNearestAmenity } from './safety.service';

interface AuthRequest extends Request {
  user?: any;
}

export const enableSOSController = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🚨 enableSOSController - req.user:', req.user);
    const { userID, emergencyType, message, emergencyContact, latitude, longitude } = req.body;

    // Validate required fields
    if (!userID) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!emergencyType || typeof emergencyType !== 'string') {
      return res.status(400).json({ message: 'Emergency type must be a valid string' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'Valid latitude and longitude are required' });
    }

    // Call service function
    const result = await enableSOS({
      accessToken: req.headers.authorization || '',
      emergencyType,
      message: message || undefined,
      userID,
      emergencyContact: emergencyContact || undefined,
      latitude,
      longitude
    });

    return res.status(200).json({
      message: 'SOS activated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in enableSOSController:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate SOS';
    return res.status(500).json({ message: errorMessage });
  }
};

export const disableSOSController = async (req: AuthRequest, res: Response) => {
  try {
    console.log('✅ disableSOSController - req.user:', req.user);
    const { userID } = req.body;

    // Validate required fields
    if (!userID) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Call service function
    const result = await disableSOS({
      accessToken: req.headers.authorization || '',
      userID
    });

    return res.status(200).json({
      message: 'SOS deactivated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in disableSOSController:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate SOS';
    return res.status(500).json({ message: errorMessage });
  }
};

export const getNearestAmenity = async (req: Request, res: Response) => {
  try {
    const { amenity, latitude, longitude, tourism, aeroway } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required.' });
    }
    
    if (!amenity && !tourism && !aeroway) {
      return res.status(400).json({ error: 'At least one of amenity, tourism, or aeroway must be provided.' });
    }
    
    const results = await findNearestAmenity(amenity, latitude, longitude, tourism, aeroway);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch amenities.' });
  }
};
