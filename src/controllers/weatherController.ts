import { Request, Response } from 'express';
import { getWeather } from '../services/weatherService';

export const fetchWeather = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, date } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Missing required parameters: latitude and longitude',
      });
    }

    // Parse latitude and longitude as numbers
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    // Validate that they are valid numbers
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        error: 'Invalid latitude or longitude. Must be valid numbers.',
      });
    }

    // Get weather data
    const weatherData = await getWeather(lat, lng, date as string | undefined);

    res.status(200).json({
      success: true,
      data: weatherData,
    });
  } catch (error: any) {
    console.error('Weather fetch error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch weather data',
    });
  }
};
