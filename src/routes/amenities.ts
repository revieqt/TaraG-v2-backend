import { Router } from 'express';
import { getNearestAmenity } from '../controllers/amenitiesController';

const router = Router();

router.post('/nearest', getNearestAmenity);

export default router;
