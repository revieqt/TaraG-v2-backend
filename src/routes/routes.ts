import { Router } from 'express';
import {
  getRoutesHandler,
} from '../controllers/routeController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
router.post('/get', authMiddleware, getRoutesHandler);

export default router;