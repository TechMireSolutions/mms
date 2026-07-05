import type { FastifyInstance } from 'fastify';
import { resolveSubdomainFromRequest } from '../../lib/tenantContext.js';
import { registerConnection } from '../../services/websocketService.js';

export default async function websocketRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws', { websocket: true }, (connection: any, req) => {
    const socket = connection.socket || connection;
    const subdomain = resolveSubdomainFromRequest(
      req.headers.host,
      req.headers['x-forwarded-host']
    );

    if (!subdomain) {
      socket.close(4000, 'Missing subdomain context');
      return;
    }

    const cookies = app.parseCookie(req.headers.cookie ?? '');
    const token = cookies.mms_access || (req.query as any)?.token;

    if (!token) {
      socket.close(4001, 'Unauthorized - Missing token');
      return;
    }

    try {
      const decoded = app.jwt.verify(token) as any;
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
    } catch (err) {
      socket.close(4001, 'Unauthorized - Verification failed');
    }
  });
}
