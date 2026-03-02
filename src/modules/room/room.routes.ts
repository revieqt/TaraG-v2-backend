import express from 'express';
import {
  getRooms,
  getSpecificRoom,
  createRoom,
  leaveRoom,
  updateRoomImage,
  updateRoomColor,
  updateAttachedItinerary,
  inviteUser,
  approveInvite,
  updateNickname,
} from './room.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { upload, processRoomImage } from '../../middleware/uploadMiddleware';

const router = express.Router();

/**
 * A. Get all rooms the user is a member of
 * GET /rooms
 */
router.get('/', authMiddleware, getRooms);

/**
 * B. Get specific room details
 * GET /rooms/view/:roomID
 */
router.get('/view/:roomID', authMiddleware, getSpecificRoom);

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

/**
 * F. Update room image
 * POST /rooms/update-image
 * Body: { roomID }, File: image
 */
router.post('/update-image', authMiddleware, upload.single('image'), processRoomImage, updateRoomImage);

/**
 * G. Update room color
 * POST /rooms/update-color
 * Body: { roomID, color }
 */
router.post('/update-color', authMiddleware, updateRoomColor);

/**
 * H. Update attached itinerary
 * POST /rooms/update-itinerary
 * Body: { roomID, itineraryID }
 */
router.post('/update-itinerary', authMiddleware, updateAttachedItinerary);

/**
 * I. Invite user to room
 * POST /rooms/invite
 * Body: { roomID, userID }
 */
router.post('/invite', authMiddleware, inviteUser);

/**
 * J. Approve invite
 * POST /rooms/approve-invite
 * Body: { roomID, userID }
 */
router.post('/approve-invite', authMiddleware, approveInvite);

/**
 * K. Update user nickname
 * POST /rooms/update-nickname
 * Body: { roomID, userID, nickname }
 */
router.post('/update-nickname', authMiddleware, updateNickname);

export default router;
