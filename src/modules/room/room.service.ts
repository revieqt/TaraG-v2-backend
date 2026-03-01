import jwt from 'jsonwebtoken';
import { RoomModel, IRoom } from './room.model';
import { ItineraryModel } from '../itinerary/itinerary.model';
import User from '../account/account.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a random 6-character alphanumeric invite code
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Decode JWT token and extract userID
 */
const decodeTokenAndGetUserID = (token: string): string => {
  try {
    const secretKey = process.env.JWT_SECRET || 'default_secret';
    const decoded: any = jwt.verify(token, secretKey);
    if (!decoded.userId) {
      throw new Error('Invalid token: userId not found');
    }
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * A. Get all rooms that the user is a member of
 * Returns: { id, name, roomImage?, memberCount }
 */
export const getRoomsService = async (accessToken: string) => {
  try {
    console.log('🔵 getRoomsService - Decoding token');
    const userID = decodeTokenAndGetUserID(accessToken);
    console.log(`🔵 getRoomsService - UserID: ${userID}`);

    const rooms = await RoomModel.find({
      'members.userID': userID,
    }).select('_id name roomImage members');

    console.log(`🔵 getRoomsService - Found ${rooms.length} rooms`);

    const formattedRooms = rooms.map((room) => ({
      id: room._id,
      name: room.name,
      ...(room.roomImage && { roomImage: room.roomImage }),
      memberCount: room.members.length,
    }));

    return formattedRooms;
  } catch (error) {
    console.error('❌ Error in getRoomsService:', error);
    throw error;
  }
};

/**
 * B. Get specific room details
 * Returns: { name, inviteCode, roomImage?, roomColor, itineraryID?, itineraryTitle?, itineraryStartDate?, itineraryEndDate?, chatID, admins, members }
 */
export const getSpecificRoomService = async (accessToken: string, roomID: string) => {
  try {
    console.log(`🔵 getSpecificRoomService - Decoding token and fetching room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);
    console.log(`🔵 getSpecificRoomService - UserID: ${userID}`);

    const room = await RoomModel.findById(roomID);

    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is a member of the room
    const isMember = room.members.some((m) => m.userID === userID);
    if (!isMember) {
      throw new Error('Access denied: User is not a member of this room');
    }

    console.log(`🔵 getSpecificRoomService - User is a member, fetching member details`);

    // Get user information for members
    const memberUserIDs = [...new Set(room.members.map((m) => m.userID))];
    const users: any[] = await User.find({ _id: { $in: memberUserIDs } }).select('_id username');
    const userMap = new Map(users.map((u) => [u._id.toString(), u.username]));

    const formattedMembers = room.members.map((m) => ({
      userID: m.userID,
      ...(m.nickname && { nickname: m.nickname }),
      username: userMap.get(m.userID.toString()) || 'Unknown',
      joinedOn: m.joinedOn,
      status: m.status,
    }));

    const response: any = {
      name: room.name,
      inviteCode: room.inviteCode,
      ...(room.roomImage && { roomImage: room.roomImage }),
      roomColor: room.roomColor,
      chatID: room.chatID,
      admins: room.admins,
      members: formattedMembers,
    };

    // Add itinerary details if itineraryID exists
    if (room.itineraryID) {
      response.itineraryID = room.itineraryID;
      try {
        const itinerary = await ItineraryModel.findById(room.itineraryID).select(
          'title startDate endDate'
        );
        if (itinerary) {
          response.itineraryTitle = itinerary.title;
          response.itineraryStartDate = itinerary.startDate;
          response.itineraryEndDate = itinerary.endDate;
        }
      } catch (err) {
        console.warn('⚠️ Failed to fetch itinerary details:', err);
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Error in getSpecificRoomService:', error);
    throw error;
  }
};

/**
 * C. Create a new room
 * The user who creates the room becomes the admin and a member
 */
export const createRoomService = async (
  accessToken: string,
  name: string,
  invitedMembers?: string[],
  itineraryID?: string
) => {
  try {
    console.log('🔵 createRoomService - Decoding token');
    const userID = decodeTokenAndGetUserID(accessToken);
    console.log(`🔵 createRoomService - UserID: ${userID}, Room name: ${name}`);

    // Validate room name
    if (!name || name.trim().length === 0) {
      throw new Error('Room name is required');
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let codeExists = true;
    while (codeExists) {
      const existing = await RoomModel.findOne({ inviteCode });
      if (!existing) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    console.log(`🔵 createRoomService - Generated invite code: ${inviteCode}`);

    // Generate chat ID (using UUID)
    const chatID = uuidv4();

    // Create initial members array with the creator
    const members: any[] = [
      {
        userID,
        joinedOn: new Date(),
        status: 'member',
      },
    ];

    // Add invited members if provided
    if (invitedMembers && Array.isArray(invitedMembers) && invitedMembers.length > 0) {
      for (const memberID of invitedMembers) {
        // Check if member already exists
        if (!members.some((m) => m.userID === memberID)) {
          members.push({
            userID: memberID,
            joinedOn: new Date(),
            status: 'invited',
          });
        }
      }
    }

    // Create room object
    const roomData: any = {
      name: name.trim(),
      inviteCode,
      chatID,
      admins: [userID],
      members,
      roomColor: '#00CAFF',
      roomImage: '',
    };

    // Add itineraryID if provided
    if (itineraryID) {
      roomData.itineraryID = itineraryID;
      console.log(`🔵 createRoomService - Room linked to itinerary: ${itineraryID}`);
    }

    const newRoom = await RoomModel.create(roomData);

    console.log(`🔵 createRoomService - Room created with ID: ${newRoom._id}`);

    return {
      id: newRoom._id,
      name: newRoom.name,
      inviteCode: newRoom.inviteCode,
      roomColor: newRoom.roomColor,
    };
  } catch (error) {
    console.error('❌ Error in createRoomService:', error);
    throw error;
  }
};

/**
 * D. Leave a room
 * - If user is admin and no other admins exist, return error
 * - If user is last member, delete the room
 */
export const leaveRoomService = async (accessToken: string, roomID: string) => {
  try {
    console.log(`🔵 leaveRoomService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);
    console.log(`🔵 leaveRoomService - UserID: ${userID}`);

    const room = await RoomModel.findById(roomID);

    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is a member of the room
    const memberIndex = room.members.findIndex((m) => m.userID === userID);
    if (memberIndex === -1) {
      throw new Error('User is not a member of this room');
    }

    console.log(`🔵 leaveRoomService - User found in room, checking admin status`);

    // Check if user is admin
    const isAdmin = room.admins.includes(userID);

    if (isAdmin) {
      // Check if there are other admins
      const otherAdmins = room.admins.filter((adminID) => adminID !== userID);
      if (otherAdmins.length === 0) {
        console.log('❌ leaveRoomService - User is only admin');
        throw new Error(
          'You cannot leave the room as the only admin. Please assign another admin first.'
        );
      }
      console.log(`🔵 leaveRoomService - User is admin, but ${otherAdmins.length} other admin(s) exist`);
    }

    // Remove user from members
    room.members.splice(memberIndex, 1);

    // Remove user from admins if they were an admin
    if (isAdmin) {
      room.admins = room.admins.filter((adminID) => adminID !== userID);
      console.log(`🔵 leaveRoomService - User removed from admins`);
    }

    // Check if room is now empty
    if (room.members.length === 0) {
      console.log(`🔵 leaveRoomService - Room is empty, deleting room`);
      await RoomModel.findByIdAndDelete(roomID);
      return {
        success: true,
        message: 'You have left the room. The room has been deleted as it has no members.',
        roomDeleted: true,
      };
    }

    // Save updated room
    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 leaveRoomService - User successfully left the room`);
    return {
      success: true,
      message: 'You have left the room successfully.',
      roomDeleted: false,
    };
  } catch (error) {
    console.error('❌ Error in leaveRoomService:', error);
    throw error;
  }
};
