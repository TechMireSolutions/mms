import type { FastifyInstance } from 'fastify';
import authRoutes from './auth.js';
import contactRoutes from './contacts.js';
import dbRoutes from './db.js';
import emailRoutes from './email.js';
import healthRoutes from './health.js';
import platformAuthRoutes from './platformAuth.js';
import studentsRoutes from './students.js';
import workspaceRoutes from './workspace.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(platformAuthRoutes, { prefix: '/api/platform/auth' });
  await app.register(workspaceRoutes, { prefix: '/api/workspace' });
  await app.register(dbRoutes, { prefix: '/api/db' });
  await app.register(contactRoutes, { prefix: '/api/contacts' });
  await app.register(emailRoutes, { prefix: '/api/email' });
  await app.register(studentsRoutes, { prefix: '/api/students' });
}
