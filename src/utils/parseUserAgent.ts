export interface IDevice {
  brand?: string;
  model?: string;
  os?: string;
  type?: string; // mobile / tablet / desktop
  appVersion?: string;
}

export const parseUserAgent = (userAgent: string): { platform: string; device: IDevice } => {
  let platform = "unknown";
  const device: IDevice = {};

  if (/android/i.test(userAgent)) {
    platform = "android";
    device.type = "mobile";
    device.os = "Android";
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    platform = "ios";
    device.type = /ipad/i.test(userAgent) ? "tablet" : "mobile";
    device.os = "iOS";
  } else if (/windows|macintosh|linux/i.test(userAgent)) {
    platform = "web";
    device.type = "desktop";
    device.os = /windows/i.test(userAgent) ? "Windows" : /macintosh/i.test(userAgent) ? "MacOS" : "Linux";
  }

  // Optional: parse brand/model from user-agent string if available
  // For simplicity, leave it empty; can enhance later

  return { platform, device };
};
