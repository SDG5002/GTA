//Get common client IP , Accounts for the reverese proxies too
export const getClientIp = (req) => {
  // Check common reverse proxy headers
  let ip = req.headers["x-forwarded-for"];

  // x-forwarded-for can be a comma-separated list of IPs. If there are many proxies involved.
  // The first one is nearest to client (means client itself)
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Normalize IPv6-mapped IPv4 addresses
  //  (e.g., "::ffff:127.0.0.1" -> "127.0.0.1")
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  // Normalize localhost IPv6 address to IPv4
  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip || "";
};
