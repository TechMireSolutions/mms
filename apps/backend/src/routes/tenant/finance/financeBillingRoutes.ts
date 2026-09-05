import type { FastifyPluginAsync } from 'fastify';
import { FINANCE_MODULE_MANIFEST, generateInvoicesBodySchema, type User } from '@mms/shared';
import { ZodError } from 'zod';
import { canReadCollection, canWriteCollection } from '../../../services/rbacService.js';
import { sendBadRequest, sendForbidden, sendIfHttpDomainError, sendDatabaseError } from '../../../lib/httpErrors.js';
import { withTenant } from '../../../db/tenant-context.js';
import {
  loadFeeStructures,
  removeFeeStructure,
  upsertFeeStructure,
} from '../../../finance/use-cases/financeBillingUseCases.js';
import { generateInvoices } from '../../../finance/use-cases/financeInvoiceGenerationUseCases.js';

const COLLECTION = FINANCE_MODULE_MANIFEST.collectionKey;

/** Fee structures + items (Setup). */
export const financeBillingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/fee-structures', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const structures = await withTenant(String(request.tenant?.id), () => loadFeeStructures(), {
        readOnly: true,
      });
      return reply.send({ structures });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to load fee structures', error);
    }
  });

  fastify.put('/fee-structures', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const structure = await withTenant(
        String(request.tenant?.id),
        () => upsertFeeStructure(request.body as Parameters<typeof upsertFeeStructure>[0]),
        { readOnly: false },
      );
      return reply.send({ structure });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to save fee structure', error);
    }
  });

  fastify.post('/invoices/generate', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      const body = generateInvoicesBodySchema.parse(request.body);
      const result = await withTenant(String(request.tenant?.id), () => generateInvoices(body), {
        readOnly: false,
      });
      return reply.send(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return sendBadRequest(reply, error.issues[0]?.message ?? 'Invalid generate request');
      }
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to generate invoices', error);
    }
  });

  fastify.delete<{ Params: { id: string } }>('/fee-structures/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, COLLECTION)) return sendForbidden(reply);
    try {
      await withTenant(String(request.tenant?.id), () => removeFeeStructure(request.params.id), {
        readOnly: false,
      });
      return reply.send({ success: true });
    } catch (error) {
      return sendIfHttpDomainError(reply, error) ?? sendDatabaseError(reply, 'Failed to delete fee structure', error);
    }
  });
};
