import { logger } from './logger.js';

export interface MinimalWebSocket {
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(): void;
  send(data: string): void;
  bufferedAmount?: number;
  on(event: 'pong', listener: () => void): void;
  on(event: 'close', listener: () => void): void;
  on(event: 'error', listener: (err: Error) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off?(event: string, listener: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeListener?(event: string, listener: (...args: any[]) => void): void;
}

export const MAX_WS_BUFFERED_AMOUNT = 512 * 1024; // 512 KB backpressure threshold

export interface ActiveConnection {
  subdomain: string;
  socket: MinimalWebSocket;
  userId: string;
}

const connectionsByTenant = new Map<string, Set<ActiveConnection>>();

export function getActiveConnectionsCount(): number {
  let count = 0;
  for (const set of connectionsByTenant.values()) {
    count += set.size;
  }
  return count;
}

export function getTenantConnections(subdomain: string): Set<ActiveConnection> | undefined {
  return connectionsByTenant.get(subdomain.trim().toLowerCase());
}

/**
 * Registers an active WebSocket connection for a given tenant subdomain and user ID.
 * Returns an unregister function to call when the connection closes.
 */
export function registerConnection(
  subdomain: string,
  socket: MinimalWebSocket,
  userId: string,
): () => void {
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
