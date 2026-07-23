export interface ServerConfig {
  isProd: boolean;
  jwtSecret: string;
  databaseUrl: string;
  trustProxy: boolean | string[];
  logLevel: string;
  allowedOrigin: string;
  bodyLimit: number;
  requestTimeoutMs: number;
  pgPoolMax: number;
}

export function loadServerConfig(): ServerConfig {
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isTest) {
      jwtSecret = 'test-secret-at-least-32-characters-long';
    } else {
      throw new Error(
        'JWT_SECRET environment variable is required but not set. ' +
          'Set it in your .env file or deployment environment before starting the server.',
      );
    }
  }
  if (isProd) {
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    const BANNED_SECRETS = ['change-me', 'dev-local-change-me', 'secret', '12345678901234567890123456789012'];
    if (BANNED_SECRETS.includes(jwtSecret)) {
      throw new Error('JWT_SECRET uses a known weak or default placeholder. Set a high-entropy secret key in production.');
    }
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (isTest) {
      databaseUrl = 'postgres://postgres:postgres@localhost:5432/mms';
    } else {
      throw new Error(
        'DATABASE_URL environment variable is required but not set. ' +
          'Set it in your .env file or deployment environment before starting the server.',
      );
    }
  }

  const trustProxyValue = process.env.TRUST_PROXY?.trim();
  if (trustProxyValue === 'true') {
    throw new Error(
      'TRUST_PROXY=true is unsafe. Set TRUST_PROXY to a comma-separated list of trusted proxy IPs or CIDR ranges.',
    );
  }
  const trustedProxies = trustProxyValue && trustProxyValue !== 'false'
    ? trustProxyValue.split(',').map((entry) => entry.trim()).filter(Boolean)
    : [];

  return {
    isProd,
    jwtSecret,
    databaseUrl,
    trustProxy: trustedProxies.length > 0 ? trustedProxies : false,
    logLevel: process.env.LOG_LEVEL || 'info',
    allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    bodyLimit: Number(process.env.REQUEST_BODY_LIMIT_BYTES) || 1024 * 1024,
    requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 120_000,
    pgPoolMax: Number(process.env.PG_POOL_MAX) || 20,
  };
}
