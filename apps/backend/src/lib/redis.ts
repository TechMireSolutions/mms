import { Redis } from 'ioredis';

let redisInstance: Redis | null = null;
let isRedisConnected = false;

export function checkIsRedisConnected(): boolean {
  return isRedisConnected;
}

// In-memory fallback map when Redis is not reachable or in non-Redis test runs (bounded to 5000 entries)
const IN_MEMORY_STORE_MAX_ENTRIES = 5000;
const inMemoryStore = new Map<string, { value: string; expiresAt?: number }>();

export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl && (process.env.NODE_ENV === 'test' || process.env.VITEST)) {
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
      if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
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
  if (!redisUrl && (process.env.NODE_ENV === 'test' || process.env.VITEST)) {
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
      if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
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
  if (inMemoryStore.size >= IN_MEMORY_STORE_MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, entry] of inMemoryStore.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        inMemoryStore.delete(k);
      }
    }
    if (inMemoryStore.size >= IN_MEMORY_STORE_MAX_ENTRIES) {
      const oldestKey = inMemoryStore.keys().next().value;
      if (oldestKey) inMemoryStore.delete(oldestKey);
    }
  }
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

export type RedisBatchOp =
  | { key: string; type: 'exists' }
  | { key: string; type: 'get' };

export type RedisBatchResult = Array<boolean | string | null>;

function inMemoryBatchOp(op: RedisBatchOp): boolean | string | null {
  const entry = inMemoryStore.get(op.key);
  if (!entry) return op.type === 'exists' ? false : null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    inMemoryStore.delete(op.key);
    return op.type === 'exists' ? false : null;
  }
  return op.type === 'exists' ? true : entry.value;
}

/**
 * Runs a batch of independent Redis reads (EXISTS / GET) in a single
 * round-trip via a pipeline. Falls back to the in-memory store per-op when
 * Redis is unavailable. Results are returned in the same order as `ops`.
 */
export async function redisBatch(ops: RedisBatchOp[]): Promise<RedisBatchResult> {
  if (ops.length === 0) return [];
  const client = getRedisClient();
  if (client && isRedisConnected) {
    try {
      const pipeline = client.pipeline();
      for (const op of ops) {
        if (op.type === 'exists') pipeline.exists(op.key);
        else pipeline.get(op.key);
      }
      const results = await pipeline.exec();
      if (results) {
        return results.map(([err, res], i) => {
          if (err) return inMemoryBatchOp(ops[i]);
          const op = ops[i];
          if (op.type === 'exists') return (res as number) > 0;
          return res as string | null;
        });
      }
    } catch {
      // fall through to in-memory
    }
  }
  return ops.map(inMemoryBatchOp);
}

export function clearInMemoryRedisFallback(): void {
  inMemoryStore.clear();
}

/**
 * Gracefully disconnects all active Redis client connections.
 */
export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      redisInstance.disconnect();
    }
    redisInstance = null;
  }
  if (redisSubscriberInstance) {
    try {
      await redisSubscriberInstance.quit();
    } catch {
      redisSubscriberInstance.disconnect();
    }
    redisSubscriberInstance = null;
  }
  isRedisConnected = false;
  inMemoryStore.clear();
}
