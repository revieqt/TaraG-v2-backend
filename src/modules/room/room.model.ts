import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  _id: string;
  name: string;
  createdOn: Date;
  updatedOn: Date;
  inviteCode: string;
  roomImage: string;
  roomColor: string;
  itineraryID?: string;
  chatID: string;
  admins: string[];
  members: Array<{
    userID: string;
    nickname?: string;
    joinedOn: Date;
    status: 'member' | 'invited' | 'waiting';
  }>;
}

const RoomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  createdOn: {
    type: Date,
    default: () => new Date(),
  },
  updatedOn: {
    type: Date,
    default: () => new Date(),
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  roomImage: {
    type: String,
    default: '',
  },
  roomColor: {
    type: String,
    default: '#00CAFF',
  },
  itineraryID: {
    type: String,
    default: undefined,
  },
  chatID: {
    type: String,
    required: true,
  },
  admins: {
    type: [String],
    default: [],
  },
  members: {
    type: [
      {
        userID: {
          type: String,
          required: true,
        },
        nickname: {
          type: String,
          default: undefined,
        },
        joinedOn: {
          type: Date,
          default: () => new Date(),
        },
        status: {
          type: String,
          enum: ['member', 'invited', 'waiting'],
          default: 'member',
        },
      },
    ],
    default: [],
  },
});

// Indexes for scalability
// Index for quick lookup of rooms by inviteCode
RoomSchema.index({ inviteCode: 1 });

// Index for finding rooms by itineraryID
RoomSchema.index({ itineraryID: 1 });

// Compound index for finding rooms by members - optimizes queries for user's rooms
RoomSchema.index({ 'members.userID': 1, 'members.status': 1 });

// Index for finding rooms by admins
RoomSchema.index({ admins: 1 });

// Index for sorting by creation date
RoomSchema.index({ createdOn: -1 });

// Compound index for TTL-like operations and cleanup
RoomSchema.index({ updatedOn: 1 });

export const RoomModel = model<IRoom>('Room', RoomSchema);
