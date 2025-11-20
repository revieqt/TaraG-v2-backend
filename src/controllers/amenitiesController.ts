import { Request, Response } from 'express';
import { findNearestAmenity } from '../services/amenitiesService';

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
