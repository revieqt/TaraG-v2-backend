import { Request } from "express";
import { IDevice } from "../models/logModel";
import { parseUserAgent } from "../utils/parseUserAgent";

// Extend Request type locally
interface RequestWithLog extends Request {
  logInfo?: {
    ip?: string;
    platform?: string;
    device?: IDevice;
    action?: string;
    module?: string;
    severity?: "info" | "warning" | "error";
  };
}

// Usage in middleware
export const logMiddleware = (action: string, module: string) => {
  return (req: RequestWithLog, res: any, next: any) => {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || undefined;
    const userAgent = req.headers["user-agent"] || "";
    const { platform, device } = parseUserAgent(userAgent);

    req.logInfo = { ip: ip as string, platform, device, action, module };

    next();
  };
};
