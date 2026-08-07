import { resolveApiUrl } from '@/lib/apiClientHelpers';

export type TenantDatabaseUpdateMessage = {
  event: 'database-update';
  type: 'collection' | 'object';
  key: string;
};

export function resolveTenantWebSocketUrl(): string {
  const httpUrl = resolveApiUrl('/api/ws');
  if (/^https?:\/\//i.test(httpUrl)) {
    return httpUrl.replace(/^http/i, 'ws');
  }
  if (typeof window === 'undefined') return 'ws://127.0.0.1/api/ws';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/ws`;
}

export function parseTenantDatabaseUpdate(raw: string): TenantDatabaseUpdateMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (record.event !== 'database-update') return null;
    if (record.type !== 'collection' && record.type !== 'object') return null;
    if (typeof record.key !== 'string' || !record.key.trim()) return null;
    return {
      event: 'database-update',
      type: record.type,
      key: record.key,
    };
  } catch {
    return null;
  }
}

type TenantWebSocketHandlers = {
  onDatabaseUpdate: (message: TenantDatabaseUpdateMessage) => void;
  onError?: (error: unknown) => void;
};

/**
 * Cookie-auth tenant WS client for `/api/ws`.
 * Reconnects with exponential backoff; browser handles ping/pong automatically.
 */
export function connectTenantDatabaseSocket(handlers: TenantWebSocketHandlers): () => void {
  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const clearReconnect = () => {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  const scheduleReconnect = () => {
    if (closedByCaller) return;
    clearReconnect();
    const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
    attempt += 1;
    reconnectTimer = setTimeout(open, delayMs);
  };

  const open = () => {
    if (closedByCaller) return;
    clearReconnect();
    try {
      socket = new WebSocket(resolveTenantWebSocketUrl());
    } catch (error) {
      handlers.onError?.(error);
      scheduleReconnect();
      return;
    }

    socket.addEventListener('open', () => {
      attempt = 0;
    });

    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      const message = parseTenantDatabaseUpdate(event.data);
      if (message) handlers.onDatabaseUpdate(message);
    });

    socket.addEventListener('error', (event) => {
      handlers.onError?.(event);
    });

    socket.addEventListener('close', (event) => {
      socket = null;
      // Do not auto-reconnect if closed due to auth, missing token, or subdomain mismatch (4000-4009)
      if (!closedByCaller && (event.code < 4000 || event.code > 4009)) {
        scheduleReconnect();
      }
    });
  };

  open();

  return () => {
    closedByCaller = true;
    clearReconnect();
    if (socket) {
      const s = socket;
      socket = null;
      if (s.readyState === WebSocket.CONNECTING) {
        s.addEventListener('open', () => {
          s.close(1000, 'Client unmounted');
        });
      } else if (s.readyState === WebSocket.OPEN) {
        s.close(1000, 'Client unmounted');
      }
    }
  };
}
