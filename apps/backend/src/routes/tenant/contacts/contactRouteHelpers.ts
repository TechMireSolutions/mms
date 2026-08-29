import type { BackgroundJobRecord, Contact, ContactsSavedReportViewer, User } from '@mms/shared';
import type { FastifyReply } from 'fastify';
import {
  CONTACTS_MODULE_MANIFEST,
  roleHasPermission,
  sanitizeContactForViewer,
  sanitizeContactsForViewer,
} from '@mms/shared';
import { createCollectionAuditHelper } from '../../../lib/createCollectionAuditHelper.js';
import {
  canReadContacts,
  canWriteContacts,
  canDeleteContacts,
} from '../../../services/rbacService.js';
import { enqueueBackgroundJob, getUserBackgroundJob } from '../../../services/backgroundJobWorkerService.js';
import { getRequestTenant } from '../../../lib/tenantContext.js';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { loadContactFieldConfig } from '../../../services/contactConfigService.js';
import { replyValidationError } from '../../../lib/zodRequest.js';
import { ContactPermissionError, ContactUniqueFieldError } from '../../../services/contactService.js';

export type ContactPermission = 'read' | 'write' | 'delete';

export function handleContactWriteError(
  reply: FastifyReply,
  error: unknown,
  fallbackMessage = 'Failed to save contact record',
): ReturnType<FastifyReply['status']> {
  if (error instanceof ContactPermissionError) {
    return sendForbidden(reply, error.message);
  }
  if (error instanceof ContactUniqueFieldError) {
    return replyValidationError(reply, error.message, { errors: error.errors });
  }

  const pgCode = (error as { code?: string })?.code;
  const pgDetail = (error as { detail?: string })?.detail || '';
  const constraintName = (error as { constraint?: string })?.constraint || '';
  if (pgCode === '23505') {
    let fieldId = 'cnic';
    let tabId = 'basic';
    let message = 'Value must be unique per contact';
    if (constraintName.includes('cnic') || pgDetail.includes('cnic')) {
      fieldId = 'cnic';
      tabId = 'basic';
      message = 'CNIC must be unique per contact';
    } else if (constraintName.includes('phone') || pgDetail.includes('phone')) {
      fieldId = 'number';
      tabId = 'phones';
      message = 'Phone number must be unique per contact';
    } else if (constraintName.includes('email') || pgDetail.includes('email')) {
      fieldId = 'address';
      tabId = 'emails';
      message = 'Email address must be unique per contact';
    }
    return replyValidationError(reply, message, {
      errors: [{ fieldId, tabId, message }],
    });
  }

  return sendDatabaseError(reply, fallbackMessage, error);
}

export function formatContactWriteError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof ContactUniqueFieldError ||
    (error && typeof error === 'object' && 'errors' in error && Array.isArray((error as { errors?: unknown[] }).errors))
  ) {
    const errWithErrors = error as { message: string; errors?: Record<string, unknown>[] };
    return {
      status: 400 as const,
      body: { type: 'validation_error' as const, message: errWithErrors.message, errors: errWithErrors.errors },
    };
  }
  const errObj = error as { message?: string; statusCode?: number; errors?: Record<string, unknown>[] };
  const msg = errObj?.message || fallbackMessage;
  const isValidation = errObj?.statusCode === 400 || /unique|conflict|already exists|validation/i.test(msg);
  if (isValidation) {
    return {
      status: 400 as const,
      body: {
        type: 'validation_error' as const,
        message: msg,
        ...(Array.isArray(errObj?.errors) ? { errors: errObj.errors } : {}),
      },
    };
  }
  return { status: 500 as const, body: { type: 'database_error' as const, message: msg } };
}

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
