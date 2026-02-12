// src/middleware/rateLimitMiddleware.ts

import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request } from "express";

/**
 * Extracts real client IP address safely.
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }

  return req.ip || "unknown";
};

/**
 * Factory function to create rate limiters.
 * Allows different limits per route.
 */
export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message?: string
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max: maxRequests,

    keyGenerator: (req: Request) => {
      return getClientIp(req);
    },

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        message:
          message ||
          "You have exceeded the allowed number of requests. Please try again later.",
        ip: getClientIp(req),
      });
    },
  });
};

/**
 * Predefined limiters for common TaraG use cases
 */

export const loginLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5,
  "Too many login attempts. Please wait 1 minute."
);

export const registerLimiter = createRateLimiter(
  60 * 1000,
  3,
  "Too many registration attempts. Please wait 1 minute."
);

export const aiSuggestionLimiter = createRateLimiter(
  60 * 1000,
  10,
  "Too many itinerary suggestions. Please wait before requesting again."
);

export const paymentLimiter = createRateLimiter(
  60 * 1000,
  5,
  "Too many payment requests. Please slow down."
);

export const emergencyLimiter = createRateLimiter(
  60 * 1000,
  3,
  "Emergency feature temporarily locked due to repeated usage."
);
