import { getRequestTenant } from './tenantContext.js';

export interface MinimalWebSocket {
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(): void;
  send(data: string): void;
  on(event: 'pong', listener: () => void): void;
  on(event: 'close', listener: () => void): void;
  on(event: 'error', listener: (err: Error) => void): void;
}

interface ActiveConnection {
  subdomain: string;
  socket: MinimalWebSocket;
  userId: string;
}

const activeConnections = new Set<ActiveConnection>();

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
          console.warn('[WS PubSub] Failed to subscribe to mms:ws-invalidation:', err);
        }
      });
      redisSubscriber.subscribe(JOB_EVENT_CHANNEL).catch((err) => {
        subscribed = false; // allow a later retry (e.g. on `ready`)
        if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
          console.warn('[WS PubSub] Failed to subscribe to mms:job-event:', err);
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
        console.error('[WS PubSub] Failed to process Redis message:', err);
      }
    });
  }
}

/**
 * Registers an active WebSocket connection for a given tenant subdomain and user ID.
 * Returns an unregister function to call when the connection closes.
 */
export function registerConnection(subdomain: string, socket: MinimalWebSocket, userId: string): () => void {
  const connection: ActiveConnection = { subdomain, socket, userId };
  activeConnections.add(connection);

  // Setup heartbeat ping intervals to proactively detect dead sockets
  let isAlive = true;
  socket.on('pong', () => {
    isAlive = true;
  });

  const pingInterval = setInterval(() => {
    if (!isAlive) {
      clearInterval(pingInterval);
      socket.terminate();
      return;
    }
    isAlive = false;
    socket.ping();
  }, 30000);
  if (typeof pingInterval.unref === 'function') {
    pingInterval.unref();
  }

  const cleanup = () => {
    clearInterval(pingInterval);
    activeConnections.delete(connection);
    console.log(`[WS] Connection closed for user "${userId}" on subdomain "${subdomain}"`);
  };

  socket.on('close', cleanup);
  socket.on('error', (err: Error) => {
    console.error(`[WS] Connection error for user "${userId}" on subdomain "${subdomain}":`, err);
    cleanup();
  });

  console.log(`[WS] Connection registered for user "${userId}" on subdomain "${subdomain}". Active total: ${activeConnections.size}`);
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
  const message = JSON.stringify({
    event: 'database-update',
    type,
    key,
  });

  let sentCount = 0;
  for (const connection of activeConnections) {
    if (connection.subdomain === subdomain) {
      try {
        connection.socket.send(message);
        sentCount++;
      } catch (err) {
        console.error(`[WS] Failed to send update to user "${connection.userId}" on subdomain "${subdomain}":`, err);
      }
    }
  }

  if (sentCount > 0) {
    console.log(`[WS] Broadcasted database-update (${type}: "${key}") to ${sentCount} clients in subdomain "${subdomain}".`);
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
      console.error('[WS] Failed to publish WS invalidation to Redis:', err);
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
  const message = JSON.stringify(jobEvent);

  let sentCount = 0;
  for (const connection of activeConnections) {
    if (connection.subdomain === jobEvent.tenantId) {
      if (!jobEvent.userId || connection.userId === jobEvent.userId) {
        try {
          connection.socket.send(message);
          sentCount++;
        } catch (err) {
          console.error(`[WS] Failed to send job event to user "${connection.userId}":`, err);
        }
      }
    }
  }

  if (sentCount > 0) {
    console.log(`[WS] Broadcasted job event (${jobEvent.event} for job ${jobEvent.jobId}) to ${sentCount} clients.`);
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
