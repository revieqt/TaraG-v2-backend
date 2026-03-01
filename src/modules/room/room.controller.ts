import { Request, Response } from 'express';
import {
  getRoomsService,
  getSpecificRoomService,
  createRoomService,
  leaveRoomService,
} from './room.service';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * A. Get all rooms the user is a member of
 */
export const getRooms = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 getRooms - Received request');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ getRooms - No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const rooms = await getRoomsService(token);

    console.log(`🔵 getRooms - Returning ${rooms.length} rooms`);
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
    const { roomID } = req.body;

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
    res.status(200).json({
      message: result.message,
      data: {
        success: result.success,
        roomDeleted: result.roomDeleted,
      },
    });
  } catch (error) {
    console.error('❌ Error in leaveRoom:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle admin error
    if (errorMessage.includes('only admin')) {
      return res.status(403).json({
        message: errorMessage,
      });
    }

    // Handle not a member error
    if (errorMessage.includes('not a member')) {
      return res.status(403).json({ message: errorMessage });
    }

    // Handle room not found
    if (errorMessage.includes('Room not found')) {
      return res.status(404).json({ message: errorMessage });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: errorMessage,
    });
  }
};
