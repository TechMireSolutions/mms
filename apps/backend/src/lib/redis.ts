import { Redis } from 'ioredis';

let redisInstance: Redis | null = null;
let isRedisConnected = false;

export function checkIsRedisConnected(): boolean {
  return isRedisConnected;
}

// In-memory fallback map when Redis is not reachable or in non-Redis test runs
const inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();

export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const url = redisUrl || 'redis://127.0.0.1:6379';
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    client.on('connect', () => {
      isRedisConnected = true;
    });

    client.on('error', (err: Error) => {
      isRedisConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Redis] Connection warning: ${err.message}`);
      }
    });

    client.connect().catch(() => {
      isRedisConnected = false;
    });

    redisInstance = client;
    return redisInstance;
  } catch {
    isRedisConnected = false;
    return null;
  }
}

let redisSubscriberInstance: Redis | null = null;

export function getRedisSubscriberClient(): Redis | null {
  if (redisSubscriberInstance) return redisSubscriberInstance;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const url = redisUrl || 'redis://127.0.0.1:6379';
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });

    client.on('error', (err: Error) => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Redis Subscriber] Connection warning: ${err.message}`);
      }
    });

    client.connect().catch(() => {});

    redisSubscriberInstance = client;
    return redisSubscriberInstance;
  } catch {
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (client && isRedisConnected) {
    try {
      return await client.get(key);
    } catch {
      // Fallback to in-memory on error
    }
  }

  const entry = inMemoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    inMemoryStore.delete(key);
    return null;
  }
  return entry.value;
}

export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const client = getRedisClient();
  if (client && isRedisConnected) {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, value, 'EX', ttlSeconds);
      } else {
        await client.set(key, value);
      }
      return;
    } catch {
      // Fallback to in-memory
    }
  }

  const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
  inMemoryStore.set(key, { value, expiresAt });
}

export async function redisDel(key: string): Promise<void> {
  const client = getRedisClient();
  if (client && isRedisConnected) {
    try {
      await client.del(key);
    } catch {
      // Fallback to in-memory
    }
  }
  inMemoryStore.delete(key);
}

export async function redisExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (client && isRedisConnected) {
    try {
      const res = await client.exists(key);
      return res > 0;
    } catch {
      // Fallback to in-memory
    }
  }

  const entry = inMemoryStore.get(key);
  if (!entry) return false;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    inMemoryStore.delete(key);
    return false;
  }
  return true;
}

export function clearInMemoryRedisFallback(): void {
  inMemoryStore.clear();
}
