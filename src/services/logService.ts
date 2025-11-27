import { IDevice, ILog, LogModel, LogSeverity } from "../models/logModel";

interface LogActionParams {
  userId?: string;
  action: string;
  module: string;
  description?: string;
  ip?: string;
  platform?: string;
  device?: IDevice;
  severity?: LogSeverity;
  metadata?: Record<string, any>;
}

export const logAction = async (params: LogActionParams) => {
  try {
    const log = new LogModel({
      userId: params.userId,
      action: params.action,
      module: params.module,
      description: params.description,
      ip: params.ip,
      platform: params.platform,
      device: params.device,
      severity: params.severity || "info",
      metadata: params.metadata,
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("Error saving log:", error);
  }
};
