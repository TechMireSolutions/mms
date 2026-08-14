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

export function configureRedisPubSub(publisher: { publish: (channel: string, message: string) => Promise<unknown> }): void {
  redisPublisher = publisher;
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
 * Convenience helper: broadcasts a collection update for the current request tenant.
 * No-ops if there is no active tenant context.
 */
export async function broadcastCollection(key: string): Promise<void> {
  const tenant = getRequestTenant();
  if (tenant) broadcastTenantUpdate(tenant, 'collection', key);
}
