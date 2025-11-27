export const LogActions = {
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_REGISTERED: "USER_REGISTERED",
  ROUTE_CREATED: "ROUTE_CREATED",
  ROUTE_NAV_STARTED: "ROUTE_NAVIGATION_STARTED",
  ROUTE_NAV_FINISHED: "ROUTE_NAVIGATION_FINISHED",
  ALERT_VIEWED: "ALERT_VIEWED",
  ITINERARY_CREATED: "ITINERARY_CREATED",
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
  SOS_TRIGGERED: "SOS_TRIGGERED",
} as const;

export type LogAction = typeof LogActions[keyof typeof LogActions];

export const LogModules = {
  AUTH: "auth",
  ROUTE: "route",
  ALERT: "alert",
  ITINERARY: "itinerary",
  PAYMENT: "payment",
  SOS: "emergency",
  ADMIN: "admin",
  PORTAL: "portal",
} as const;

export type LogModule = typeof LogModules[keyof typeof LogModules];

export const LogSeverity = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
} as const;

export type LogSeverity = typeof LogSeverity[keyof typeof LogSeverity];
