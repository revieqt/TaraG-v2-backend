import express from 'express';
import { getRooms, getSpecificRoom, createRoom, leaveRoom } from './room.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

/**
 * A. Get all rooms the user is a member of
 * GET /rooms
 */
router.get('/', authMiddleware, getRooms);

/**
 * B. Get specific room details
 * POST /rooms/specific
 * Body: { roomID }
 */
router.post('/specific', authMiddleware, getSpecificRoom);

/**
 * C. Create a new room
 * POST /rooms/create
 * Body: { name, invitedMembers?: string[], itineraryID?: string }
 */
router.post('/create', authMiddleware, createRoom);

/**
 * D. Leave a room
 * POST /rooms/leave
 * Body: { roomID }
 */
router.post('/leave', authMiddleware, leaveRoom);

export default router;
