export interface ServerConfig {
  isProd: boolean;
  jwtSecret: string;
  trustProxy: boolean;
  logLevel: string;
  allowedOrigin: string;
  bodyLimit: number;
  requestTimeoutMs: number;
  pgPoolMax: number;
}

export function loadServerConfig(): ServerConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is required but not set. ' +
        'Set it in your .env file or deployment environment before starting the server.',
    );
  }
  if (isProd && jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }

  return {
    isProd,
    jwtSecret,
    trustProxy: process.env.TRUST_PROXY === 'true' || isProd,
    logLevel: process.env.LOG_LEVEL || 'info',
    allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    bodyLimit: Number(process.env.REQUEST_BODY_LIMIT_BYTES) || 1024 * 1024,
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 120_000,
    pgPoolMax: Number(process.env.PG_POOL_MAX) || 20,
  };
}
