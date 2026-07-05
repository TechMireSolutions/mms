import {
  sessionRecordSchema,
  type SessionRecord,
} from '../validation/sessionSchemas.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listSessionsByWorkspace,
  findSessionById,
  saveSession,
} from '../db/repositories/sessionRepository.js';

export async function loadSessions(options?: { includeDeleted?: boolean }): Promise<SessionRecord[]> {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  const all = await listSessionsByWorkspace(tenant);
  return options?.includeDeleted ? all : all.filter((row) => !row.deletedAt);
}

export async function createSession(record: SessionRecord): Promise<SessionRecord> {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const resolvedId = String(record.id ?? `sess-${Date.now()}`);
  const normalized = sessionRecordSchema.parse({ ...record, id: resolvedId });
  await saveSession(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'sessions');
  return normalized;
}

export async function updateSessionById(id: string, record: SessionRecord): Promise<SessionRecord | null> {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  const existing = await findSessionById(tenant, id);
  if (!existing || existing.deletedAt) return null;
  const normalized = sessionRecordSchema.parse({ ...record, id });
  await saveSession(tenant, normalized);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'sessions');
  return normalized;
}

export async function deleteSessionById(
  id: string,
  deletedBy: string,
  deletionReason?: string,
): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findSessionById(tenant, id);
  if (!existing || existing.deletedAt) return false;
  const updated = {
    ...existing,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletionReason: deletionReason || undefined,
  };
  await saveSession(tenant, updated);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'sessions');
  return true;
}

export async function restoreSessionById(id: string): Promise<boolean> {
  const tenant = getRequestTenant();
  if (!tenant) return false;
  const existing = await findSessionById(tenant, id);
  if (!existing || !existing.deletedAt) return false;
  const { deletedAt: _deletedAt, deletedBy: _deletedBy, deletionReason: _deletionReason, ...rest } = existing;
  const restored = rest as SessionRecord;
  await saveSession(tenant, restored);
  const { broadcastTenantUpdate } = await import('./websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'sessions');
  return true;
}
