import { Request, Response } from 'express';
import {
  getRoomsService,
  getSpecificRoomService,
  createRoomService,
  leaveRoomService,
  updateRoomImageService,
  updateRoomColorService,
  updateAttachedItineraryService,
  inviteUserService,
  approveInviteService,
  updateNicknameService,
} from './room.service';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * A. Get all rooms the user is a member of
 * Query params: status (optional) - 'member' (default), 'invited', 'waiting'
 */
export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 getRooms - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { status } = req.query as { status?: string };

    if (!token) {
      console.log('❌ getRooms - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const rooms = await getRoomsService(token, status || 'member');

    console.log(`🔵 getRooms - Returning ${rooms.length} rooms (status filter: ${status || 'member'})`);
    res.status(200).json({
      message: 'Rooms retrieved successfully',
      data: rooms,
    });
  } catch (error) {
    console.error('❌ Error in getRooms:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * B. Get specific room details
 */
export const getSpecificRoom = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 getSpecificRoom - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID } = req.params;

    if (!token) {
      console.log('❌ getSpecificRoom - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ getSpecificRoom - No roomID provided');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    const roomData = await getSpecificRoomService(token, roomID);

    console.log('🔵 getSpecificRoom - Room data retrieved successfully');
    res.status(200).json({
      message: 'Room details retrieved successfully',
      data: roomData,
    });
  } catch (error) {
    console.error('❌ Error in getSpecificRoom:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle access denied errors
    if (errorMessage.includes('not a member')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: errorMessage,
    });
  }
};

/**
 * C. Create a new room
 */
export const createRoom = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 createRoom - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { name, invitedMembers, itineraryID } = req.body;

    if (!token) {
      console.log('❌ createRoom - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!name) {
      console.log('❌ createRoom - Room name is required');
      return res.status(400).json({ message: 'Room name is required' });
    }

    const newRoom = await createRoomService(token, name, invitedMembers, itineraryID);

    console.log('🔵 createRoom - Room created successfully');
    res.status(201).json({
      message: 'Room created successfully',
      data: newRoom,
    });
  } catch (error) {
    console.error('❌ Error in createRoom:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * D. Leave a room
 */
export const leaveRoom = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 leaveRoom - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID } = req.body;

    if (!token) {
      console.log('❌ leaveRoom - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ leaveRoom - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    const result = await leaveRoomService(token, roomID);

    console.log('🔵 leaveRoom - User left room successfully');
    res.status(200).send();
  } catch (error) {
    console.error('❌ Error in leaveRoom:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle admin error
    if (errorMessage.includes('only admin')) {
      return res.status(403).json({ message: errorMessage });
    }

    // Handle not a member error
    if (errorMessage.includes('not a member')) {
      return res.status(403).json({ message: errorMessage });
    }

    // Handle room not found
    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * F. Update room image
 */
export const updateRoomImage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 updateRoomImage - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID } = req.body;
    const imagePath = (req as any).processedImagePath;

    if (!token) {
      console.log('❌ updateRoomImage - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ updateRoomImage - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!imagePath) {
      console.log('❌ updateRoomImage - Image file is required');
      return res.status(400).json({ message: 'Image file is required' });
    }

    await updateRoomImageService(token, roomID, imagePath);

    console.log('🔵 updateRoomImage - Room image updated successfully');
    res.status(200).send();
  } catch (error) {
    console.error('❌ Error in updateRoomImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * G. Update room color
 */
export const updateRoomColor = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 updateRoomColor - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID, color } = req.body;

    if (!token) {
      console.log('❌ updateRoomColor - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ updateRoomColor - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!color) {
      console.log('❌ updateRoomColor - Color is required');
      return res.status(400).json({ message: 'Color is required' });
    }

    await updateRoomColorService(token, roomID, color);

    console.log('🔵 updateRoomColor - Room color updated successfully');
    res.status(200).send();
  } catch (error) {
    console.error('❌ Error in updateRoomColor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('Invalid color format')) {
      return res.status(400).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * H. Update attached itinerary
 */
export const updateAttachedItinerary = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 updateAttachedItinerary - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID, itineraryID } = req.body;

    if (!token) {
      console.log('❌ updateAttachedItinerary - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ updateAttachedItinerary - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!itineraryID) {
      console.log('❌ updateAttachedItinerary - Itinerary ID is required');
      return res.status(400).json({ message: 'Itinerary ID is required' });
    }

    await updateAttachedItineraryService(token, roomID, itineraryID);

    console.log('🔵 updateAttachedItinerary - Attached itinerary updated successfully');
    res.status(200).json({
      message: 'Itinerary attached successfully',
      data: { itineraryID }
    });
  } catch (error) {
    console.error('❌ Error in updateAttachedItinerary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('Itinerary not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * I. Invite user to room
 */
export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 inviteUser - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID, userID } = req.body;

    if (!token) {
      console.log('❌ inviteUser - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ inviteUser - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!userID) {
      console.log('❌ inviteUser - User ID is required');
      return res.status(400).json({ message: 'User ID is required' });
    }

    await inviteUserService(token, roomID, userID);

    console.log('🔵 inviteUser - User invited successfully');
    res.status(200).json({
      message: 'User invited successfully',
      data: { userID }
    });
  } catch (error) {
    console.error('❌ Error in inviteUser:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('already a member')) {
      return res.status(400).json({ message: errorMessage });
    }

    if (errorMessage.includes('User not found') || errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * J. Approve invite
 */
export const approveInvite = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 approveInvite - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID, userID } = req.body;

    if (!token) {
      console.log('❌ approveInvite - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ approveInvite - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!userID) {
      console.log('❌ approveInvite - User ID is required');
      return res.status(400).json({ message: 'User ID is required' });
    }

    await approveInviteService(token, roomID, userID);

    console.log('🔵 approveInvite - Invite approved successfully');
    res.status(200).json({
      message: 'Invite approved successfully',
      data: { userID, status: 'member' }
    });
  } catch (error) {
    console.error('❌ Error in approveInvite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('not invited') || errorMessage.includes('not in invited status')) {
      return res.status(400).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};

/**
 * K. Update user nickname
 */
export const updateNickname = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 updateNickname - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const { roomID, userID, nickname } = req.body;

    if (!token) {
      console.log('❌ updateNickname - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    if (!roomID) {
      console.log('❌ updateNickname - Room ID is required');
      return res.status(400).json({ message: 'Room ID is required' });
    }

    if (!userID) {
      console.log('❌ updateNickname - User ID is required');
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (nickname === undefined || nickname === null) {
      console.log('❌ updateNickname - Nickname is required');
      return res.status(400).json({ message: 'Nickname is required' });
    }

    await updateNicknameService(token, roomID, userID, nickname);

    console.log('🔵 updateNickname - Nickname updated successfully');
    res.status(200).send();
  } catch (error) {
    console.error('❌ Error in updateNickname:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('only admins')) {
      return res.status(403).json({ message: errorMessage });
    }

    if (errorMessage.includes('not a member')) {
      return res.status(404).json({ message: errorMessage });
    }

    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({ message: errorMessage });
  }
};