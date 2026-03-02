import jwt from 'jsonwebtoken';
import { RoomModel, IRoom } from './room.model';
import { ItineraryModel } from '../itinerary/itinerary.model';
import User from '../account/account.model';
import fs from 'fs';
import path from 'path';

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
 * Status filter: 'member' (default), 'invited', 'waiting'
 */
export const getRoomsService = async (accessToken: string, status: string = 'member') => {
  try {
    console.log(`🔵 getRoomsService - Decoding token with status filter: ${status}`);
    const userID = decodeTokenAndGetUserID(accessToken);
    console.log(`🔵 getRoomsService - UserID: ${userID}`);

    // Validate status parameter
    const validStatuses = ['member', 'invited', 'waiting'];
    const targetStatus = validStatuses.includes(status) ? status : 'member';

    const rooms = await RoomModel.find({
      'members': {
        $elemMatch: {
          userID: userID,
          status: targetStatus,
        },
      },
    }).select('_id name roomImage members');

    console.log(`🔵 getRoomsService - Found ${rooms.length} rooms with status '${targetStatus}'`);

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

    // Create room object with all fields initialized
    const roomData: any = {
      name: name.trim(),
      createdOn: new Date(),
      updatedOn: new Date(),
      inviteCode,
      roomImage: '',
      roomColor: '#00CAFF',
      itineraryID: itineraryID || '',
      chatID: '',
      admins: [userID],
      members,
    };

    console.log(`🔵 createRoomService - Room data initialized:`, roomData);

    const newRoom = await RoomModel.create(roomData);

    console.log(`🔵 createRoomService - Room created with ID: ${newRoom._id}`);

    // Get user information for members
    const memberUserIDs = [...new Set(newRoom.members.map((m) => m.userID))];
    const users: any[] = await User.find({ _id: { $in: memberUserIDs } }).select('_id username');
    const userMap = new Map(users.map((u) => [u._id.toString(), u.username]));

    const formattedMembers = newRoom.members.map((m) => ({
      userID: m.userID,
      ...(m.nickname && { nickname: m.nickname }),
      username: userMap.get(m.userID.toString()) || 'Unknown',
      joinedOn: m.joinedOn,
      status: m.status,
    }));

    const response: any = {
      id: newRoom._id,
      name: newRoom.name,
      inviteCode: newRoom.inviteCode,
      roomImage: newRoom.roomImage,
      roomColor: newRoom.roomColor,
      itineraryID: newRoom.itineraryID,
      chatID: newRoom.chatID,
      admins: newRoom.admins,
      members: formattedMembers,
    };

    return response;
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
      // Only throw error if they're the only admin AND there are other members
      const otherMembers = room.members.filter((m) => m.userID !== userID);
      if (otherAdmins.length === 0 && otherMembers.length > 0) {
        console.log('❌ leaveRoomService - User is only admin and there are other members');
        throw new Error(
          'You cannot leave the room as the only admin. Please assign another admin first.'
        );
      }
      console.log(`🔵 leaveRoomService - User is admin, checking if room will be empty after leaving`);
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

/**
 * F. Update room image
 * Deletes old image if exists and updates with new one
 */
export const updateRoomImageService = async (
  accessToken: string,
  roomID: string,
  newImagePath: string
) => {
  try {
    console.log(`🔵 updateRoomImageService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is an admin
    if (!room.admins.includes(userID)) {
      throw new Error('Only admins can update room image');
    }

    const oldImagePath = room.roomImage;

    // Delete old image if it exists
    if (oldImagePath && oldImagePath !== '') {
      try {
        const filename = path.basename(oldImagePath);
        const fullPath = path.join(__dirname, '../../uploads/roomImages', filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🔵 updateRoomImageService - Deleted old room image`);
        }
      } catch (err) {
        console.warn('⚠️ Failed to delete old room image:', err);
      }
    }

    // Update room with new image path
    room.roomImage = newImagePath;
    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 updateRoomImageService - Room image updated successfully`);
  } catch (error) {
    console.error('❌ Error in updateRoomImageService:', error);
    throw error;
  }
};

/**
 * G. Update room color
 */
export const updateRoomColorService = async (
  accessToken: string,
  roomID: string,
  color: string
) => {
  try {
    console.log(`🔵 updateRoomColorService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is an admin
    if (!room.admins.includes(userID)) {
      throw new Error('Only admins can update room color');
    }

    // Validate color format (hex color)
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      throw new Error('Invalid color format. Use hex format (e.g., #00CAFF)');
    }

    room.roomColor = color;
    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 updateRoomColorService - Room color updated to ${color}`);
  } catch (error) {
    console.error('❌ Error in updateRoomColorService:', error);
    throw error;
  }
};

/**
 * H. Update attached itinerary
 */
export const updateAttachedItineraryService = async (
  accessToken: string,
  roomID: string,
  itineraryID: string
) => {
  try {
    console.log(`🔵 updateAttachedItineraryService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is an admin
    if (!room.admins.includes(userID)) {
      throw new Error('Only admins can update attached itinerary');
    }

    // Verify itinerary exists
    const itinerary = await ItineraryModel.findById(itineraryID);
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    room.itineraryID = itineraryID;
    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 updateAttachedItineraryService - Room itinerary updated to ${itineraryID}`);
  } catch (error) {
    console.error('❌ Error in updateAttachedItineraryService:', error);
    throw error;
  }
};

/**
 * I. Invite user to room
 */
export const inviteUserService = async (
  accessToken: string,
  roomID: string,
  targetUserID: string
) => {
  try {
    console.log(`🔵 inviteUserService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify user is an admin
    if (!room.admins.includes(userID)) {
      throw new Error('Only admins can invite users');
    }

    // Check if user already exists in room
    const memberExists = room.members.some((m) => m.userID === targetUserID);
    if (memberExists) {
      throw new Error('User is already a member of this room');
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserID);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Add user to members with 'invited' status
    room.members.push({
      userID: targetUserID,
      joinedOn: new Date(),
      status: 'invited',
    });

    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 inviteUserService - User ${targetUserID} invited to room`);
  } catch (error) {
    console.error('❌ Error in inviteUserService:', error);
    throw error;
  }
};

/**
 * J. Approve invite (change status from 'invited' to 'member')
 */
export const approveInviteService = async (
  accessToken: string,
  roomID: string,
  userID: string
) => {
  try {
    console.log(`🔵 approveInviteService - Decoding token for room ${roomID}`);
    const requestingUserID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify requesting user is an admin
    if (!room.admins.includes(requestingUserID)) {
      throw new Error('Only admins can approve invites');
    }

    // Find the member with 'invited' status
    const member = room.members.find((m) => m.userID === userID);
    if (!member) {
      throw new Error('User is not invited to this room');
    }

    if (member.status !== 'invited') {
      throw new Error('User is not in invited status');
    }

    // Update status to 'member'
    member.status = 'member';
    member.joinedOn = new Date();

    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 approveInviteService - User ${userID} approved as member`);
  } catch (error) {
    console.error('❌ Error in approveInviteService:', error);
    throw error;
  }
};

/**
 * K. Update user nickname in room
 */
export const updateNicknameService = async (
  accessToken: string,
  roomID: string,
  targetUserID: string,
  nickname: string
) => {
  try {
    console.log(`🔵 updateNicknameService - Decoding token for room ${roomID}`);
    const userID = decodeTokenAndGetUserID(accessToken);

    const room = await RoomModel.findById(roomID);
    if (!room) {
      throw new Error('Room not found');
    }

    // Verify requesting user is an admin
    if (!room.admins.includes(userID)) {
      throw new Error('Only admins can update nicknames');
    }

    // Find the member
    const member = room.members.find((m) => m.userID === targetUserID);
    if (!member) {
      throw new Error('User is not a member of this room');
    }

    // Update nickname (allow empty string to clear nickname)
    member.nickname = nickname.trim() || undefined;

    room.updatedOn = new Date();
    await room.save();

    console.log(`🔵 updateNicknameService - User nickname updated`);
  } catch (error) {
    console.error('❌ Error in updateNicknameService:', error);
    throw error;
  }
};
