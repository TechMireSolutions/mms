import { getRequestTenant } from './tenantContext.js';
import { logger } from './logger.js';

export interface MinimalWebSocket {
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(): void;
  send(data: string): void;
  on(event: 'pong', listener: () => void): void;
  on(event: 'close', listener: () => void): void;
  on(event: 'error', listener: (err: Error) => void): void;
  off?(event: string, listener: (...args: any[]) => void): void;
  removeListener?(event: string, listener: (...args: any[]) => void): void;
}

interface ActiveConnection {
  subdomain: string;
  socket: MinimalWebSocket;
  userId: string;
}

const connectionsByTenant = new Map<string, Set<ActiveConnection>>();

function getActiveConnectionsCount(): number {
  let count = 0;
  for (const set of connectionsByTenant.values()) {
    count += set.size;
  }
  return count;
}

// Redis Pub/Sub adapter for horizontal multi-node cluster scaling
let redisPublisher: { publish: (channel: string, message: string) => Promise<unknown> } | null = null;
let redisSubscriber: {
  subscribe: (...channels: string[]) => Promise<unknown>;
  on: (event: string, listener: (...args: any[]) => void) => void;
} | null = null;

const WS_INVALIDATION_CHANNEL = 'mms:ws-invalidation';
const JOB_EVENT_CHANNEL = 'mms:job-event';

export function configureRedisPubSub(
  publisher: { publish: (channel: string, message: string) => Promise<unknown> },
  subscriber?: {
    subscribe: (...channels: string[]) => Promise<unknown>;
    on: (event: string, listener: (...args: any[]) => void) => void;
  }
): void {
  redisPublisher = publisher;
  if (subscriber) {
    redisSubscriber = subscriber;

    // The Redis subscriber client is created with `lazyConnect: true` and
    // `enableOfflineQueue: false`, so an immediate `subscribe()` at startup
    // can fail if the connection has not finished establishing yet. Subscribing
    // on the `ready` event (plus an immediate best-effort attempt) guarantees
    // the channels are eventually subscribed without a permanent silent gap in
    // cross-node WS invalidation. `subscribed` guards against double-subscribing
    // when both the immediate attempt and the `ready` event fire.
    let subscribed = false;
    const subscribeChannels = (): void => {
      if (subscribed || !redisSubscriber) return;
      subscribed = true;
      redisSubscriber.subscribe(WS_INVALIDATION_CHANNEL).catch((err) => {
        subscribed = false; // allow a later retry (e.g. on `ready`)
        if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
          logger.warn({ err }, 'Failed to subscribe to mms:ws-invalidation');
        }
      });
      redisSubscriber.subscribe(JOB_EVENT_CHANNEL).catch((err) => {
        subscribed = false; // allow a later retry (e.g. on `ready`)
        if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
          logger.warn({ err }, 'Failed to subscribe to mms:job-event');
        }
      });
    };

    subscriber.on('ready', subscribeChannels);
    subscribeChannels();

    redisSubscriber.on('message', (channel: string, message: string) => {
      try {
        if (channel === WS_INVALIDATION_CHANNEL) {
          const { subdomain, type, key } = JSON.parse(message);
          if (subdomain && type && key) {
            broadcastLocalTenantUpdate(subdomain, type, key);
          }
        } else if (channel === 'mms:job-event') {
          const jobEvent = JSON.parse(message);
          if (jobEvent && jobEvent.tenantId) {
            broadcastLocalJobEvent(jobEvent);
          }
        }
      } catch (err) {
        logger.error({ err }, 'Failed to process Redis message');
      }
    });
  }
}

/**
 * Registers an active WebSocket connection for a given tenant subdomain and user ID.
 * Returns an unregister function to call when the connection closes.
 */
export function registerConnection(subdomain: string, socket: MinimalWebSocket, userId: string): () => void {
  const normSubdomain = subdomain.trim().toLowerCase();
  const connection: ActiveConnection = { subdomain: normSubdomain, socket, userId };

  let tenantSet = connectionsByTenant.get(normSubdomain);
  if (!tenantSet) {
    tenantSet = new Set<ActiveConnection>();
    connectionsByTenant.set(normSubdomain, tenantSet);
  }
  tenantSet.add(connection);

  // Setup heartbeat ping intervals to proactively detect dead sockets
  let isAlive = true;
  const onPong = () => {
    isAlive = true;
  };
  socket.on('pong', onPong);

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;

    clearInterval(pingInterval);

    const currentSet = connectionsByTenant.get(normSubdomain);
    if (currentSet) {
      currentSet.delete(connection);
      if (currentSet.size === 0) {
        connectionsByTenant.delete(normSubdomain);
      }
    }

    if (typeof socket.off === 'function') {
      socket.off('pong', onPong);
      socket.off('close', cleanup);
      socket.off('error', onError);
    } else if (typeof socket.removeListener === 'function') {
      socket.removeListener('pong', onPong);
      socket.removeListener('close', cleanup);
      socket.removeListener('error', onError);
    }

    logger.info({ userId, subdomain: normSubdomain }, 'WS connection closed');
  };

  const onError = (err: Error) => {
    logger.error({ userId, subdomain: normSubdomain, err }, 'WS connection error');
    cleanup();
  };

  socket.on('close', cleanup);
  socket.on('error', onError);

  const pingInterval = setInterval(() => {
    if (!isAlive) {
      cleanup();
      socket.terminate();
      return;
    }
    isAlive = false;
    socket.ping();
  }, 30000);
  if (typeof pingInterval.unref === 'function') {
    pingInterval.unref();
  }

  logger.info(
    { userId, subdomain: normSubdomain, active: getActiveConnectionsCount() },
    'WS connection registered',
  );
  return cleanup;
}

/**
 * Broadcasts a real-time data update notification locally to connected sockets on this process node.
 */
export function broadcastLocalTenantUpdate(
  subdomain: string,
  type: 'collection' | 'object',
  key: string
): void {
  const normSubdomain = subdomain.trim().toLowerCase();
  const tenantSet = connectionsByTenant.get(normSubdomain);
  if (!tenantSet || tenantSet.size === 0) return;

  const message = JSON.stringify({
    event: 'database-update',
    type,
    key,
  });

  let sentCount = 0;
  for (const connection of tenantSet) {
    try {
      connection.socket.send(message);
      sentCount++;
    } catch (err) {
      logger.error({ userId: connection.userId, subdomain: normSubdomain, err }, 'Failed to send update to user');
    }
  }

  if (sentCount > 0) {
    logger.info({ type, key, sentCount, subdomain: normSubdomain }, 'Broadcasted database-update');
  }
}

/**
 * Broadcasts a real-time data update notification to all active client sockets of a tenant subdomain,
 * publishing to Redis Pub/Sub if configured for multi-node cluster scale out.
 */
export function broadcastTenantUpdate(
  subdomain: string,
  type: 'collection' | 'object',
  key: string
): void {
  // Always emit locally on current node
  broadcastLocalTenantUpdate(subdomain, type, key);

  // If Redis Pub/Sub is configured, publish to cluster
  if (redisPublisher) {
    const payload = JSON.stringify({ subdomain, type, key });
    redisPublisher.publish('mms:ws-invalidation', payload).catch((err) => {
      logger.error({ err }, 'Failed to publish WS invalidation to Redis');
    });
  }
}

/**
 * Broadcasts a background job status/progress event locally to connected sockets.
 */
export function broadcastLocalJobEvent(jobEvent: {
  event: string;
  tenantId: string;
  userId?: string;
  jobId: string;
  moduleId?: string;
  kind?: string;
  progress?: { current: number; total: number; percent: number };
  label?: string;
  hasDownload?: boolean;
  error?: string;
}): void {
  const normSubdomain = jobEvent.tenantId.trim().toLowerCase();
  const tenantSet = connectionsByTenant.get(normSubdomain);
  if (!tenantSet || tenantSet.size === 0) return;

  const message = JSON.stringify(jobEvent);

  let sentCount = 0;
  for (const connection of tenantSet) {
    if (!jobEvent.userId || connection.userId === jobEvent.userId) {
      try {
        connection.socket.send(message);
        sentCount++;
      } catch (err) {
        logger.error({ userId: connection.userId, err }, 'Failed to send job event to user');
      }
    }
  }

  if (sentCount > 0) {
    logger.info({ event: jobEvent.event, jobId: jobEvent.jobId, sentCount }, 'Broadcasted job event');
  }
}

/**
 * Convenience helper: broadcasts a collection update for the current request tenant.
 * No-ops if there is no active tenant context.
 */
export async function broadcastCollection(key: string): Promise<void> {
  const tenant = getRequestTenant();
  if (tenant) broadcastTenantUpdate(tenant, 'collection', key);
}

/**
 * Closes all active WebSocket connections across all tenants and clears the map.
 */
export function closeAllConnections(): void {
  for (const set of connectionsByTenant.values()) {
    for (const connection of set) {
      try {
        connection.socket.terminate();
      } catch {
        // ignore errors on close
      }
    }
  }
  connectionsByTenant.clear();
}
