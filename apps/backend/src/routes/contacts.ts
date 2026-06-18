import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import type { Contact, User, WhatsAppStatus } from '@mms/shared';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canReadCollection, canWriteCollection } from '../services/rbacService.js';
import { getLinkedContactId } from '../services/auth/userService.js';
import { contactRecordSchema } from '../validation/contactSchemas.js';
import { resourceIdParamsSchema } from '../validation/commonSchemas.js';
import { parseRequest, replyValidationError } from '../lib/zodRequest.js';
import {
  deleteContactById,
  loadContacts,
  updateContactById,
  upsertContact,
} from '../services/contactService.js';
import { getWhatsAppPreferences } from '../services/whatsapp/whatsAppService.js';

import { sendForbidden } from '../lib/httpErrors.js';

/**
 * Server-first contact resource routes (TanStack Query on FE).
 */
export default async function contactRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'contacts')) return sendForbidden(reply);
    try {
      return reply.send({ contacts: await loadContacts() });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list contacts' });
    }
  });

  fastify.get('/count', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'contacts')) return sendForbidden(reply);
    try {
      const contacts = await loadContacts();
      return reply.send({ count: contacts.length });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to count contacts' });
    }
  });

  fastify.post('/', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'contacts')) return sendForbidden(reply);

    const parsed = parseRequest(contactRecordSchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    try {
      const { contact, created } = await upsertContact(parsed.data as Contact);
      return reply
        .status(created ? 201 : 200)
        .send({ success: true, contact });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save contact record';
      return reply.status(500).send({ type: 'database_error', message: msg });
    }
  });

  fastify.put('/:id', async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const linkedContactId = await getLinkedContactId(user.id);
    const isOwnContact =
      linkedContactId != null && String(linkedContactId) === params.data.id;
    if (!isOwnContact && !canWriteCollection(user, 'contacts')) {
      return sendForbidden(reply);
    }
    const body = parseRequest(contactRecordSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    try {
      const updated = await updateContactById(params.data.id, {
        ...body.data,
        id: body.data.id ?? params.data.id,
      } as Contact);
      if (!updated) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      return reply.send({ contact: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update contact';
      return reply.status(500).send({ type: 'database_error', message: msg });
    }
  });

  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'contacts')) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    try {
      const deleted = await deleteContactById(params.data.id);
      if (!deleted) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete contact' });
    }
  });

  fastify.get('/:id/whatsapp-status', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'contacts')) return sendForbidden(reply);

    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    try {
      const contacts = await loadContacts();
      const contact = contacts.find((c) => String(c.id) === params.data.id);
      if (!contact) {
        return reply.status(404).send({ type: 'not_found', message: `Contact with ID "${params.data.id}" not found` });
      }

      const prefs = await getWhatsAppPreferences();
      const defaultStatus: WhatsAppStatus = 'PENDING';
      return reply.send({
        whatsappStatus: (contact.whatsappStatus as WhatsAppStatus) || defaultStatus,
        lastCheckedAt: contact.lastCheckedAt || null,
        uiIndicatorStyle: prefs.uiIndicatorStyle,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to retrieve WhatsApp status';
      return reply.status(500).send({ type: 'server_error', message: msg });
    }
  });
}
