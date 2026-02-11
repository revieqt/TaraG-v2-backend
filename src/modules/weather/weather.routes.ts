import { Router } from 'express';
import { getWeatherController } from './weather.controller';

const router = Router();

// GET /api/weather?city=...&latitude=...&longitude=...&date=...
router.get('/', getWeatherController);

export default router;
