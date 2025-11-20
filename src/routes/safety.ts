import express from 'express';
import { enableSOSController, disableSOSController } from '../controllers/safetyController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * Enable SOS/Emergency mode
 * POST /api/safety/enable-sos
 * Requires authentication token
 * Body:
 * - emergencyType (string): Type of emergency (e.g., "Medical", "Accident", "Threat", etc.)
 * - message (optional string): Additional message about the emergency
 * - userID (string): User ID from SessionContext
 * - emergencyContact (optional string): Email address to send alert to
 * - latitude (number): Current latitude coordinate
 * - longitude (number): Current longitude coordinate
 */
router.post('/enable-sos', authMiddleware, enableSOSController);

/**
 * Disable SOS/Emergency mode
 * POST /api/safety/disable-sos
 * Requires authentication token
 * Body:
 * - userID (string): User ID from SessionContext
 */
router.post('/disable-sos', authMiddleware, disableSOSController);

export default router;
