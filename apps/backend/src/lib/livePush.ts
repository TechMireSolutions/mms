import { getRequestTenant } from './tenantContext.js';
import { logger } from './logger.js';
import { redisDel, redisDelPattern, redisKeys } from './redis.js';
import {
  type MinimalWebSocket,
  MAX_WS_BUFFERED_AMOUNT,
  getTenantConnections,
  registerConnection,
  closeAllConnections,
  getActiveConnectionsCount,
} from './livePushConnections.js';

export {
  type MinimalWebSocket,
  MAX_WS_BUFFERED_AMOUNT,
  registerConnection,
  closeAllConnections,
  getActiveConnectionsCount,
};

// Redis Pub/Sub adapter for horizontal multi-node cluster scaling
let redisPublisher: { publish: (channel: string, message: string) => Promise<unknown> } | null = null;
let redisSubscriber: {
  subscribe: (...channels: string[]) => Promise<unknown>;
  on: (event: string, listener: (...args: any[]) => void) => void;
} | null = null;

const WS_INVALIDATION_CHANNEL = redisKeys.wsInvalidationChannel;
const JOB_EVENT_CHANNEL = redisKeys.jobEventChannel;

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
      redisSubscriber.subscribe(WS_INVALIDATION_CHANNEL, JOB_EVENT_CHANNEL).catch((err) => {
        subscribed = false; // allow a later retry (e.g. on `ready`)
        if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
          logger.warn({ err }, 'Failed to subscribe to Redis PubSub channels');
        }
      });
    };

    subscriber.on('ready', subscribeChannels);
    const status = (subscriber as { status?: string }).status;
    if (status === undefined || status === 'ready') {
      subscribeChannels();
    }

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
 * Broadcasts a real-time data update notification locally to connected sockets on this process node.
 */
export function broadcastLocalTenantUpdate(
  subdomain: string,
  type: 'collection' | 'object',
  key: string
): void {
  const normSubdomain = subdomain.trim().toLowerCase();
  const tenantSet = getTenantConnections(normSubdomain);
  if (!tenantSet || tenantSet.size === 0) return;

  const message = JSON.stringify({
    event: 'database-update',
    type,
    key,
  });

  let sentCount = 0;
  for (const connection of tenantSet) {
    try {
      if (
        typeof connection.socket.bufferedAmount === 'number' &&
        connection.socket.bufferedAmount > MAX_WS_BUFFERED_AMOUNT
      ) {
        logger.warn(
          { userId: connection.userId, subdomain: normSubdomain, bufferedAmount: connection.socket.bufferedAmount },
          'WS socket buffer backlog exceeded threshold; terminating stalled connection',
        );
        connection.socket.terminate();
        continue;
      }
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

  // Invalidate Redis domain metrics and dashboard cache for this tenant/collection
  const cleanTenant = subdomain?.trim().toLowerCase();
  if (cleanTenant && type === 'collection') {
    void redisDel(redisKeys.metrics(cleanTenant, key));
    void redisDelPattern(redisKeys.dashboardSummaryPattern(cleanTenant));
  }

  // If Redis Pub/Sub is configured, publish to cluster
  if (redisPublisher) {
    const payload = JSON.stringify({ subdomain, type, key });
    redisPublisher.publish(WS_INVALIDATION_CHANNEL, payload).catch((err) => {
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
  const tenantSet = getTenantConnections(normSubdomain);
  if (!tenantSet || tenantSet.size === 0) return;

  const message = JSON.stringify(jobEvent);

  let sentCount = 0;
  for (const connection of tenantSet) {
    if (!jobEvent.userId || connection.userId === jobEvent.userId) {
      try {
        if (
          typeof connection.socket.bufferedAmount === 'number' &&
          connection.socket.bufferedAmount > MAX_WS_BUFFERED_AMOUNT
        ) {
          logger.warn(
            { userId: connection.userId, jobId: jobEvent.jobId, bufferedAmount: connection.socket.bufferedAmount },
            'WS socket buffer backlog exceeded threshold; terminating stalled connection',
          );
          connection.socket.terminate();
          continue;
        }
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
