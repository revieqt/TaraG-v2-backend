import { Router } from 'express';
import {
  getRoutesHandler,
} from './route.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();
router.post('/get', authMiddleware, getRoutesHandler);

export default router;