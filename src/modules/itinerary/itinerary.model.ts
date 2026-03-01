import { Schema, model, Document } from 'mongoose';
import { ItineraryStatus } from './itinerary.types';

export interface IAddress {
  country?: string;
  region?: string;
  province?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  postal_code?: string;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  locationName: string;
  address?: IAddress;
  note: string;
}

export interface IDailyItinerary {
  date: Date;
  locations: ILocation[];
}

export interface IItinerary extends Document {
  userID: string;
  title: string;
  type: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: ItineraryStatus;
  createdOn: Date;
  updatedOn: Date;
  planDaily: boolean;
  locations: ILocation[] | IDailyItinerary[];
}

const LocationSchema = new Schema<ILocation>(
  {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: {
        country: { type: String, trim: true },
        region: { type: String, trim: true },
        province: { type: String, trim: true },
        city: { type: String, trim: true },
        district: { type: String, trim: true },
        neighborhood: { type: String, trim: true },
        postal_code: { type: String, trim: true },
      },
      default: null,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const DailyItinerarySchema = new Schema<IDailyItinerary>(
  {
    date: {
      type: Date,
      required: true,
    },
    locations: {
      type: [LocationSchema],
      required: true,
      default: [],
    },
  },
  { _id: false }
);

const ItinerarySchema = new Schema<IItinerary>({
  userID: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'done'],
    default: 'active',
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
  planDaily: {
    type: Boolean,
    required: true,
    default: false,
  },
  locations: {
    type: Schema.Types.Mixed,
    required: true,
    default: [],
  },
});

export const ItineraryModel = model<IItinerary>('Itinerary', ItinerarySchema);
