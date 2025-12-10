// utils/parseUserAgent.ts

export const parseUserAgent = (userAgent?: string) => {
  if (!userAgent) {
    return {
      browser: "Unknown",
      os: "Unknown",
      platform: "Unknown",
    };
  }

  // Simple parsing (good enough for logs)
  const browserMatch = userAgent.match(
    /(firefox|msie|chrome|safari|trident|edg)\/?\s*(\d+)/i
  );

  const osMatch = userAgent.match(
    /(Windows NT|Mac OS X|Android|iPhone OS|Linux)[\s\/]?([0-9\._]+)?/
  );

  return {
    browser: browserMatch ? `${browserMatch[1]} ${browserMatch[2]}` : "Unknown",
    os: osMatch ? `${osMatch[1]} ${osMatch[2] || ""}`.trim() : "Unknown",
    platform: /mobile/i.test(userAgent) ? "Mobile" : "Desktop",
  };
};
