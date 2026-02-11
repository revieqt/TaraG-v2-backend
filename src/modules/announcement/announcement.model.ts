import { Schema, model, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  image: string;
  altDesc: string;
  isExternal: boolean;
  linkPath: string;
  startsOn: Date;
  endsOn: Date;
  createdOn: Date;
  updatedOn: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  image: {
    type: String,
    required: true,
    trim: true,
  },

  altDesc: {
    type: String,
    required: true,
    trim: true,
  },

  isExternal: {
    type: Boolean,
    required: true,
    default: false,
  },

  linkPath: {
    type: String,
    required: true,
    trim: true,
  },

  startsOn: {
    type: Date,
    required: true,
  },

  endsOn: {
    type: Date,
    required: true,
  },

  createdOn: {
    type: Date,
    default: () => new Date(),
  },

  updatedOn: {
    type: Date,
    default: () => new Date(),
  },
});

export const AnnouncementModel = model<IAnnouncement>("Announcement", AnnouncementSchema);
