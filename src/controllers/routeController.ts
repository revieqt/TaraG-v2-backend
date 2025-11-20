import { Request, Response } from 'express';
import {
  getRoutes,
} from '../services/routeService';

export const getRoutesHandler = async (req: Request, res: Response) => {
  try {
    const { location, mode } = req.body;
    console.log('🚀 getRoutesHandler called with:', { 
      locationCount: location?.length, 
      mode,
      locations: location?.map((loc: any, i: number) => `${i}: [${loc.latitude}, ${loc.longitude}]`)
    });
    
    if (!location || !mode) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Missing location or mode.' });
    }
    
    if (!Array.isArray(location) || location.length < 2) {
      console.log('❌ Invalid location array');
      return res.status(400).json({ error: 'Location must be an array with at least 2 points.' });
    }
    
    const route = await getRoutes({ location, mode });
    console.log('✅ Route generated successfully with segments and steps:', {
      distance: `${(route.distance / 1000).toFixed(2)} km`,
      duration: `${Math.round(route.duration / 60)} min`,
      segmentCount: route.segments?.length || 0,
      totalSteps: route.segments?.reduce((acc: number, seg: any) => acc + (seg.steps?.length || 0), 0) || 0
    });
    res.json(route);
  } catch (error) {
    console.error('❌ getRoutesHandler error:', error);
    res.status(500).json({ error: 'Failed to fetch routes.', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};