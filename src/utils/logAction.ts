// utils/logAction.ts
import { Request } from "express";
import { LogModel } from "../modules/system/logs.model";
import { parseUserAgent } from "./parseUserAgent";

interface LogParams {
  action: string;
  module: string;
  description?: string;
  severity?: "info" | "warning" | "error";
  metadataID?: string;
  userId?: string;
}

export const logAction = async (req: Request, params: LogParams) => {
  try {
    const ua = parseUserAgent(req.headers["user-agent"]);

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

      device: {
        brand: ua.browser,      // Browser behaves like "brand"
        model: "",              // Schema requires field, so placeholder
        os: ua.os,
        type: ua.platform.toLowerCase(),
        appVersion: "",         // Placeholder (can remove if not needed)
      },

      createdOn: new Date(),
    });
  } catch (error) {
    console.error("Failed to save log:", error);
  }
};
