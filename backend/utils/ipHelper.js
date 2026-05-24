/**
 * Helper to resolve client's IP address.
 * Accounts for reverse proxies like Render, Vercel, Nginx, Cloudflare, etc.
 */
export const getClientIp = (req) => {
  // Check common reverse proxy headers
  let ip = req.headers["x-forwarded-for"] ||
           req.headers["x-real-ip"] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip;

  // x-forwarded-for can be a comma-separated list of IPs.
  // The first one is always the client's actual public IP.
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Normalize IPv6-mapped IPv4 addresses (e.g., "::ffff:127.0.0.1" -> "127.0.0.1")
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  // Normalize localhost IPv6 address to IPv4
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip || "";
};
