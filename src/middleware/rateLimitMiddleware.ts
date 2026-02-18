import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

type Sensitivity = 'low' | 'moderate' | 'high';

const sensitivityConfig: Record<Sensitivity, { windowMs: number; max: number }> = {
  low: {
    windowMs: 60 * 1000, // 1 minute
    max: 20,
  },
  moderate: {
    windowMs: 60 * 1000, // 1 minute
    max: 10,
  },
  high: {
    windowMs: 60 * 1000, // 1 minute
    max: 3,
  },
};

export const rateLimitMiddleware = (sensitivity: Sensitivity): RateLimitRequestHandler => {
  const config = sensitivityConfig[sensitivity];

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: 'Too many requests from this IP, please try again later.',
    },
    keyGenerator: (req) => {
      return req.ip || 'undefined';
    },
  });
};
