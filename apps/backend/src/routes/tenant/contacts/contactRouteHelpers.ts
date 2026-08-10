import type { BackgroundJobRecord, Contact, ContactsSavedReportViewer, User } from '@mms/shared';
import type { FastifyReply } from 'fastify';
import {
  CONTACTS_MODULE_MANIFEST,
  buildContactWriteSchema,
  collectContactWriteExtraFieldKeys,
  roleHasPermission,
  sanitizeContactForViewer,
  sanitizeContactsForViewer,
} from '@mms/shared';
import type { ZodType } from 'zod';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import {
  canReadContacts,
  canWriteContacts,
  canDeleteContacts,
} from '../../../services/rbacService.js';
import { enqueueBackgroundJob, getUserBackgroundJob } from '../../../services/backgroundJobWorkerService.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendForbidden } from '../../../lib/httpErrors.js';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { parseRequest } from '../../../lib/zodRequest.js';

type ContactWriteZod = ZodType<unknown>;

export type ContactPermission = 'read' | 'write' | 'delete';

/** Contacts permission gate: sends a 403 reply and returns false when not granted. */
export function requireContactPermission(
  reply: FastifyReply,
  user: User,
  permission: ContactPermission | ContactPermission[],
): boolean {
  const required = Array.isArray(permission) ? permission : [permission];
  const granted = required.every((entry) => {
    if (entry === 'read') return canReadContacts(user);
    if (entry === 'write') return canWriteContacts(user);
    return canDeleteContacts(user);
  });
  if (!granted) void sendForbidden(reply);
  return granted;
}

/**
 * Idempotent 202 background-job enqueue shared by the VCF export + duplicate scan:
 * returns the existing job for a repeated `idempotencyKey`, otherwise enqueues a fresh one.
 */
export async function enqueueContactBackgroundJob(options: {
  moduleId: string;
  kind: string;
  label: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string | null;
  user: User;
}): Promise<BackgroundJobRecord> {
  const tenant = getRequestTenant()!;
  const userId = String(options.user.id);
  const jobId = options.idempotencyKey?.trim() || crypto.randomUUID();
  const existing = await getUserBackgroundJob(userId, jobId);
  if (existing) return existing;
  const runningJob: BackgroundJobRecord = {
    id: jobId,
    moduleId: options.moduleId,
    kind: options.kind,
    status: 'running',
    label: options.label,
    createdAt: new Date().toISOString(),
  };
  return enqueueBackgroundJob(tenant, userId, runningJob, options.payload ?? {});
}

export function savedReportViewer(user: User): ContactsSavedReportViewer {
  return {
    id: String(user.id),
    role: user.role,
    isAdmin: roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite),
  };
}

async function getFieldConfigViewerOptions() {
  const fieldConfig = await loadContactFieldConfig();
  if (!fieldConfig) return null;
  return {
    fields: fieldConfig.fields,
    tabs: fieldConfig.formTabs ?? [],
  };
}

/** Tenant write schema: system keys ∪ enabled Setup custom field keys (strict). */
async function loadContactWriteSchema(): Promise<ContactWriteZod> {
  const fieldConfig = await loadContactFieldConfig();
  return buildContactWriteSchema(collectContactWriteExtraFieldKeys(fieldConfig));
}

export async function parseContactWriteBody(
  body: unknown,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const schema = await loadContactWriteSchema();
  const parsed = parseRequest(schema, body);
  if (!parsed.ok) return parsed;
  return { ok: true, data: parsed.data as Record<string, unknown> };
}

export async function sanitizeForUser(contacts: Contact[], user: User): Promise<Contact[]> {
  const options = await getFieldConfigViewerOptions();
  if (!options) return contacts;
  return sanitizeContactsForViewer(contacts, user.role, options);
}

export async function sanitizeOneForUser(contact: Contact, user: User): Promise<Contact> {
  const options = await getFieldConfigViewerOptions();
  if (!options) return contact;
  return sanitizeContactForViewer(contact, user.role, options);
}

/** Contacts audit helper — shared factory, same shape as Teachers/Students. */
export const auditContact = createCollectionAuditHelper('contacts');
