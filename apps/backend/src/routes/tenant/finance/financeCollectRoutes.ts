import type { FastifyPluginAsync } from 'fastify';
import {
  FINANCE_MODULE_MANIFEST,
  collectInvoicesBodySchema,
  creditNoteInsertSchema,
  remindInvoicesBodySchema,
  type User,
} from '@mms/shared';
import { ZodError } from 'zod';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { sendBadRequest, sendForbidden, sendIfHttpDomainError, sendDatabaseError } from '../../../lib/httpErrors.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  cancelInvoice,
  collectOverdueInvoices,
  createCreditNote,
  loadCreditNotes,
  remindOpenInvoices,
} from '../../../finance/use-cases/financeCollectUseCases.js';

const COLLECTION = FINANCE_MODULE_MANIFEST.collectionKey;

function parseError(reply: Parameters<typeof sendBadRequest>[0], error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return sendBadRequest(reply, error.issues[0]?.message ?? fallback);
  }
  return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, fallback, error);
}

/** Overdue sweep, reminders, cancel, and credit notes. */
export const financeCollectRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/invoices/collect', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const body = collectInvoicesBodySchema.parse(request.body ?? {});
      const result = await withTenant(String(request.tenant?.id), () => collectOverdueInvoices(body), {
        readOnly: false,
      });
      return reply.send(result);
    } catch (error) {
      return parseError(reply, error, 'Failed to collect overdue invoices');
    }
  });

  fastify.post('/invoices/remind', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const body = remindInvoicesBodySchema.parse(request.body ?? {});
      const result = await withTenant(String(request.tenant?.id), () => remindOpenInvoices(body), {
        readOnly: false,
      });
      return reply.send(result);
    } catch (error) {
      return parseError(reply, error, 'Failed to prepare invoice reminders');
    }
  });

  fastify.post<{ Params: { id: string } }>('/invoices/:id/cancel', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const invoice = await withTenant(
        String(request.tenant?.id),
        () => cancelInvoice(request.params.id),
        { readOnly: false },
      );
      return reply.send({ invoice });
    } catch (error) {
      return parseError(reply, error, 'Failed to cancel invoice');
    }
  });

  fastify.get<{ Querystring: { invoiceId?: string } }>('/credit-notes', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    const invoiceId = request.query.invoiceId?.trim();
    if (!invoiceId) return sendBadRequest(reply, 'invoiceId is required');
    try {
      const notes = await withTenant(String(request.tenant?.id), () => loadCreditNotes(invoiceId), {
        readOnly: true,
      });
      return reply.send({ notes });
    } catch (error) {
      return parseError(reply, error, 'Failed to load credit notes');
    }
  });

  fastify.post('/credit-notes', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const body = creditNoteInsertSchema.parse(request.body);
      const note = await withTenant(String(request.tenant?.id), () => createCreditNote(body), {
        readOnly: false,
      });
      return reply.send({ note });
    } catch (error) {
      return parseError(reply, error, 'Failed to create credit note');
    }
  });
};
