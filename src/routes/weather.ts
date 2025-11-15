import express from 'express';
import { fetchWeather } from '../controllers/weatherController';

const router = express.Router();

/**
 * GET /api/weather
 * Fetch weather data for a specific location and date
 * 
 * Query Parameters:
 * - latitude (required): Location latitude (-90 to 90)
 * - longitude (required): Location longitude (-180 to 180)
 * - date (optional): Date in YYYY-MM-DD format. Defaults to current date.
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     date: string (YYYY-MM-DD),
 *     temperature: number | null (°C),
 *     windSpeed: number | null (km/h),
 *     humidity: number | null (%),
 *     precipitation: number | null (mm),
 *     weatherCode: number | null (WMO Weather interpretation code),
 *     weatherType: string | null (Human-readable description)
 *   }
 * }
 */
router.get('/get-weather', fetchWeather);

export default router;
