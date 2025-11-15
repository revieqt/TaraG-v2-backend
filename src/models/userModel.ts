import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  fname: string;
  lname?: string;
  username: string;
  email: string;
  password: string;
  contactNumber?: string;
  bdate: Date;
  gender: string;
  profileImage?: string;
  likes?: string[];
  type: string;
  status: string;
  bio: string;
  isFirstLogin: boolean;
  isProUser: boolean;
  expPoints: number;
  createdOn: Date;
  updatedOn: Date;
  safetyState: {
    isInAnEmergency: boolean;
    emergencyType: string;
  };
  visibilitySettings: {
    isProfilePublic: boolean;
    isPersonalInfoPublic: boolean;
    isTravelInfoPublic: boolean;
  };
  securitySettings: {
    is2FAEnabled: boolean;
  },
  taraBuddySettings: {
    isTaraBuddyEnabled: boolean;
    preferredGender?: string;
    preferredDistance?: number;
    preferredAgeRange?: number[];
    preferredZodiac?: string[];
  };
}

const userSchema = new Schema<IUser>({
  fname: { type: String, required: true },
  lname: { type: String, required: false },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"]
  },
  password: { type: String, required: true },
  contactNumber: { type: String, required: false },
  bdate: { type: Date, required: true },
  gender: { type: String, required: true },
  profileImage: { type: String, required: false },
  likes: { type: [String], default: [] },
  type: { type: String, required: true },
  status: { type: String, default: "pending" },
  bio: { type: String, default: "" },
  isFirstLogin: { type: Boolean, default: true },
  isProUser: { type: Boolean, default: false },
  expPoints: { type: Number, default: 0 },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  safetyState: {
    isInAnEmergency: { type: Boolean, default: false },
    emergencyType: { type: String, default: "" }
  },
  visibilitySettings: {
    isProfilePublic: { type: Boolean, default: true },
    isPersonalInfoPublic: { type: Boolean, default: true },
    isTravelInfoPublic: { type: Boolean, default: true },
  },
  securitySettings: {
    is2FAEnabled: { type: Boolean, default: false }
  },
  taraBuddySettings: {
    type: {
      isTaraBuddyEnabled: { type: Boolean, default: false },
      preferredGender: String,
      preferredDistance: Number,
      preferredAgeRange: [Number],
      preferredZodiac: [String],
    },
    required: false,
    default: undefined
  }
}, { timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' }});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({
  gender: 1,
  "taraBuddySettings.preferredGender": 1
});

export default mongoose.model<IUser>('User', userSchema);