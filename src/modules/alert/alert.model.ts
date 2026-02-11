import { Schema, model, Document } from "mongoose";

export interface IAlert extends Document {
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  target: "everyone" | "traveler" | "admin";
  createdOn: Date;
  startsOn: Date;
  endsOn: Date;
  locations: string[];
}

const AlertSchema = new Schema<IAlert>({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    required: false,
    trim: true,
  },

  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    required: true,
  },

  target: {
    type: String,
    enum: ["everyone", "traveler", "admin"],
    required: true,
  },

  createdOn: {
    type: Date,
    default: () => new Date(),
  },

  startsOn: {
    type: Date,
    required: true,
  },

  endsOn: {
    type: Date,
    required: true,
  },

  locations: {
    type: [String],
    default: [],
  },
});

export const AlertModel = model<IAlert>("Alert", AlertSchema);
