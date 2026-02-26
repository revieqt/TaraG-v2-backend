import { Schema, model, Document } from "mongoose";
import { ILocationPoint } from "./places.types";

export interface ILocationPointDocument extends Omit<ILocationPoint, '_id'>, Document {}

const AddressSchema = new Schema(
  {
    country: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    neighborhood: { type: String, required: true, trim: true },
    postal_code: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    opensOn: { type: String, required: true, trim: true },
    closedOn: { type: String, required: true, trim: true },
    days: { type: [String], required: true, default: [] },
  },
  { _id: false }
);

const LinkSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ReviewSchema = new Schema(
  {
    reviewedBy: { type: String, required: true, trim: true },
    reviewedOn: { type: Date, default: () => new Date() },
    stars: { type: Number, required: true, min: 1, max: 5 },
    note: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const LocationPointSchema = new Schema<ILocationPointDocument>({
  locationName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  address: {
    type: AddressSchema,
    required: true,
  },

  schedule: {
    type: ScheduleSchema,
    required: true,
  },

  latitude: {
    type: Number,
    required: true,
  },

  longitude: {
    type: Number,
    required: true,
  },

  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  type: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },

  imageUrl: {
    type: String,
    default: "",
    trim: true,
  },

  description: {
    type: String,
    required: true,
    trim: true,
  },

  updatedOn: {
    type: Date,
    default: () => new Date(),
  },

  createdBy: {
    type: String,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
    index: true,
  },

  links: {
    type: [LinkSchema],
    default: [],
  },

  reviews: {
    type: [ReviewSchema],
    default: [],
  },

  createdOn: {
    type: Date,
    default: () => new Date(),
  },
});

// Create indexes for filtering and searching
LocationPointSchema.index({ "address.country": 1 });
LocationPointSchema.index({ "address.region": 1 });
LocationPointSchema.index({ "address.province": 1 });
LocationPointSchema.index({ "address.city": 1 });
LocationPointSchema.index({ "address.district": 1 });
LocationPointSchema.index({ "address.neighborhood": 1 });

export const LocationPointModel = model<ILocationPointDocument>(
  "LocationPoint",
  LocationPointSchema
);
