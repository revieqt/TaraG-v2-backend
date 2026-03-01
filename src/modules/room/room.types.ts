// Request and Response Types
export interface GetRoomsResponse {
  id: string;
  name: string;
  roomImage?: string;
  memberCount: number;
}

export interface RoomMember {
  userID: string;
  nickname?: string;
  username?: string;
  joinedOn: Date;
  status: 'member' | 'invited' | 'waiting';
}

export interface GetSpecificRoomResponse {
  name: string;
  inviteCode: string;
  roomImage?: string;
  roomColor: string;
  itineraryID?: string;
  itineraryTitle?: string;
  itineraryStartDate?: Date;
  itineraryEndDate?: Date;
  chatID: string;
  admins: string[];
  members: RoomMember[];
}

export interface CreateRoomRequest {
  name: string;
  invitedMembers?: string[];
  itineraryID?: string;
}

export interface CreateRoomResponse {
  id: string;
  name: string;
  inviteCode: string;
  roomColor: string;
}

export interface LeaveRoomRequest {
  roomID: string;
}

// Error Response Type
export interface ErrorResponse {
  message: string;
}
