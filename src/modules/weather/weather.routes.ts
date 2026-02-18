import { Router } from 'express';
import { getWeatherController } from './weather.controller';
import { rateLimitMiddleware } from '../../middleware/rateLimitMiddleware';

const router = Router();

// GET /api/weather?city=...&latitude=...&longitude=...&date=...
router.get('/', rateLimitMiddleware('moderate'), getWeatherController);

export default router;
