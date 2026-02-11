import express from 'express';
import { enableSOSController, disableSOSController, getNearestAmenity  } from './safety.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/enable-sos', authMiddleware, enableSOSController);
router.post('/disable-sos', authMiddleware, disableSOSController);
router.post('/nearest', getNearestAmenity);


export default router;
