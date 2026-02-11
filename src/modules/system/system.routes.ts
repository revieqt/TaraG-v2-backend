import express from 'express';
import { systemHealthSSE } from './system.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// Stream incremental health check results and summary at the end
router.get('/system-health', authMiddleware, systemHealthSSE);

export default router;
