/**
 * Utility for verifying allowed CORS origins across REST API and WebSocket gateways.
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  const rawFrontendUrl = process.env.FRONTEND_URL || '';
  const configuredUrls = rawFrontendUrl
    ? rawFrontendUrl.split(',').map((u) => u.trim()).filter(Boolean)
    : [];

  if (configuredUrls.includes(origin)) {
    return true;
  }

  // Known production and development domain patterns
  const allowedDomains = [
    'cowork30.com',
    'onrender.com',
    'localhost',
    '127.0.0.1',
  ];

  if (allowedDomains.some((domain) => origin.includes(domain))) {
    return true;
  }

  // Allow local network IP addresses (e.g. 192.168.x.x, 10.x.x.x, 172.x.x.x)
  if (/^http:\/\/(192\.168|10|172)\.\d+\.\d+:\d+$/.test(origin)) {
    return true;
  }

  return false;
}

/**
 * Express / Socket.io CORS delegate callback handler.
 * Prevents throwing Express 500 Internal Server Errors when an unallowed origin makes a request.
 */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (isOriginAllowed(origin)) {
    callback(null, true);
  } else {
    // Return null, false to reject CORS without causing a server 500 error
    callback(null, false);
  }
}
