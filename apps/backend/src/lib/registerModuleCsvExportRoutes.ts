import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type { User } from '@mms/shared';
import { getRequestTenant } from './tenantContext.js';
import { enqueueCsvExportJob, normalizeExportQuery } from './csvExportEnqueue.js';
import { sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import { moduleExportAuditBodySchema } from '../validation/csvExportBodySchema.js';
import { recordAudit } from '../services/auditService.js';

export type RegisterModuleCsvExportRoutesOptions = {
  canRead: (user: User) => boolean;
  canDeleteTrash: (user: User) => boolean;
  bodySchema: ZodTypeAny;
  moduleId: string;
  defaultLabel: string;
  /** Singular entity noun for audit copy, e.g. `contact` / `student`. */
  entityNoun: string;
  /** Audit action prefixes, e.g. `contact.export` / `student.export`. */
  exportAuditAction: string;
  queueAuditAction: string;
  exportAuditSchema?: ZodTypeAny;
};

/**
 * Register POST `/export/csv` + POST `/export-audit` for a module.
 * Contacts keeps VCF/merge/setup-audit as separate handlers.
 */
export function registerModuleCsvExportRoutes(
  fastify: FastifyInstance,
  options: RegisterModuleCsvExportRoutesOptions,
): void {
  const exportAuditSchema = options.exportAuditSchema ?? moduleExportAuditBodySchema;

  fastify.post('/export/csv', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);

    const parsed = parseRequest(options.bodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const data = parsed.data as {
      query?: Record<string, unknown>;
      ids?: Array<string | number>;
      columns?: Array<{ id: string; label: string }>;
      filename?: string;
      label?: string;
      idempotencyKey?: string;
    };

    const allowDeleted = options.canDeleteTrash(user);
    const query = normalizeExportQuery(data.query, allowDeleted);
    if (data.ids && data.ids.length > 0) {
      query.includeIds = data.ids.map(String);
    }

    const label = data.label?.trim() || options.defaultLabel;
    const job = await enqueueCsvExportJob({
      tenant: getRequestTenant()!,
      userId: String(user.id),
      moduleId: options.moduleId,
      label,
      query,
      columns: data.columns,
      filename: data.filename,
      viewerRole: user.role,
      allowDeleted,
      idempotencyKey: data.idempotencyKey,
    });
    await recordAudit({
      userId: user.id,
      userEmail: user.email,
      action: options.queueAuditAction,
      entityType: 'collection',
      entityId: job.id,
      summary: `Queued ${options.entityNoun} export "${label}"`,
    });
    return reply.status(202).send({ job });
  });

  fastify.post('/export-audit', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);

    const parsed = parseRequest(exportAuditSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const data = parsed.data as {
      count: number;
      scope?: 'all' | 'filtered' | 'selection';
    };
    const scope = data.scope ?? 'filtered';
    await recordAudit({
      userId: user.id,
      userEmail: user.email,
      action: options.exportAuditAction,
      entityType: 'collection',
      entityId: options.moduleId,
      summary: `Exported ${data.count} ${options.entityNoun}(s) (${scope})`,
    });
    return reply.send({ success: true });
  });
}
