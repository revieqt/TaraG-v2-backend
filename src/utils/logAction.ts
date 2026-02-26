// utils/logAction.ts
import { Request } from "express";
import { LogModel } from "../modules/system/logs.model";
import { parseUserAgent } from "./parseUserAgent";

interface DeviceInfo {
  deviceId?: string;
  brand?: string;
  model?: string;
  os?: string;
  type?: string;
  appVersion?: string;
}

interface LogParams {
  action: string;
  module: string;
  description?: string;
  severity?: "info" | "warning" | "error";
  metadataID?: string;
  userId?: string;
  device?: DeviceInfo;
}

export const logAction = async (req: Request, params: LogParams) => {
  try {
    const ua = parseUserAgent(req.headers["user-agent"]);

    // Use device from params if provided, otherwise fall back to parsed user agent
    const deviceInfo: DeviceInfo = params.device ? {
      deviceId: params.device.deviceId || "",
      brand: params.device.brand || ua.browser,
      model: params.device.model || "",
      os: params.device.os || ua.os,
      type: params.device.type || ua.platform.toLowerCase(),
      appVersion: params.device.appVersion || "",
    } : {
      deviceId: "",
      brand: ua.browser,
      model: "",
      os: ua.os,
      type: ua.platform.toLowerCase(),
      appVersion: "",
    };

    await LogModel.create({
      action: params.action,
      module: params.module,
      description: params.description || "",
      severity: params.severity || "info",
      metadataID: params.metadataID,

      // userId from params or from req.user
      userId: params.userId || (req as any).user?.id,

      ip: req.ip || req.headers["x-forwarded-for"] || "",
      platform: ua.platform,

      device: deviceInfo,

      createdOn: new Date(),
    });
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};
