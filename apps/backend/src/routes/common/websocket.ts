import type { FastifyInstance } from 'fastify';
import { resolveSubdomainFromRequest } from '../../lib/tenantContext.js';
import { registerConnection, type MinimalWebSocket } from '../../services/websocketService.js';

interface DecodedToken {
  id: string;
  tokenType: string;
  workspaceSubdomain: string;
}

export default async function websocketRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws', { websocket: true }, (connection: unknown, req) => {
    const connObj = connection as { socket?: MinimalWebSocket };
    const socket = connObj.socket || (connection as MinimalWebSocket);
    const subdomain = resolveSubdomainFromRequest(
      req.headers.host,
      req.headers['x-forwarded-host']
    );

    if (!subdomain) {
      socket.close(4000, 'Missing subdomain context');
      return;
    }

    const cookies = app.parseCookie(req.headers.cookie ?? '');
    const query = req.query as Record<string, string | undefined> | undefined;
    const token = cookies.mms_access || query?.token;

    if (!token) {
      socket.close(4001, 'Unauthorized - Missing token');
      return;
    }

    try {
      const decoded = app.jwt.verify(token) as DecodedToken;
      if (!decoded || decoded.tokenType !== 'access') {
        socket.close(4001, 'Unauthorized - Invalid token type');
        return;
      }

      if (decoded.workspaceSubdomain !== subdomain) {
        socket.close(4003, 'Forbidden - Subdomain mismatch');
        return;
      }

      // Successful connection registration
      registerConnection(subdomain, socket, decoded.id);
    } catch {
      socket.close(4001, 'Unauthorized - Invalid token');
    }
  });
}
