import { Schema, model, Document } from "mongoose";

export type LogSeverity = "info" | "warning" | "error";

export interface IDevice {
  brand?: string;
  model?: string;
  os?: string;
  type?: string;
  appVersion?: string;
}

export interface ILog extends Document {
  userId?: string;
  action: string;
  module: string;
  description?: string;
  ip?: string;
  platform?: string;
  device?: IDevice;
  severity?: LogSeverity;
  metadataID?: string;
  createdOn: Date;
}

const LogSchema = new Schema<ILog>({
  userId: { type: String },
  action: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String, trim: true },
  ip: { type: String },
  platform: { type: String },
  device: {
    brand: { type: String },
    model: { type: String },
    os: { type: String },
    type: { type: String },
    appVersion: { type: String },
  },
  severity: { type: String, enum: ["info", "warning", "error"], default: "info" },
  metadataID: { type: String, required: false},
  createdOn: { type: Date, default: () => new Date() },
});

export const LogModel = model<ILog>("Log", LogSchema);
