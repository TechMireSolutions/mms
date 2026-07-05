import { useEffect, useRef } from 'react';
import { getWorkspaceLocalStoragePrefix } from '@/lib/db';
import { parseTenantFromHost } from '@mms/shared';
import { getAppDomain } from '@/lib/config/tenantConfig';

/**
 * A custom React hook that maintains a persistent WebSocket connection to the backend
 * and invalidates the local storage database cache when a push notification is received.
 */
export function useWebSocketSync(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const delayRef = useRef(1000);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const subdomain = parseTenantFromHost(window.location.hostname, getAppDomain());
    if (!subdomain) return; // Only sync inside tenant workspaces

    function connect() {
      if (wsRef.current) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;

      console.log(`[WS-Sync] Connecting to ${wsUrl}...`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS-Sync] Connected to real-time update socket.');
        delayRef.current = 1000; // reset reconnect delay
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event === 'database-update') {
            const { type, key } = message;
            const prefix = getWorkspaceLocalStoragePrefix();
            const storageKey = `${prefix}${key}`;

            console.log(`[WS-Sync] Invaliding local cache key "${storageKey}" due to remote update.`);
            localStorage.removeItem(storageKey);

            // Dispatch local-database-update so reactive hooks pull fresh data
            window.dispatchEvent(new Event('local-database-update'));
          }
        } catch (err) {
          console.error('[WS-Sync] Error parsing websocket message:', err);
        }
      };

      ws.onclose = (event) => {
        wsRef.current = null;
        console.warn(`[WS-Sync] Connection closed (code: ${event.code}). Reconnecting in ${delayRef.current}ms...`);
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        console.error('[WS-Sync] Socket encountered error:', err);
        // let onclose handle reconnect
        ws.close();
      };
    }

    function scheduleReconnect() {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
        // Exponential backoff up to 30s
        delayRef.current = Math.min(delayRef.current * 2, 30000);
      }, delayRef.current);
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Prevent onclose trigger during cleanup unmount
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
}
