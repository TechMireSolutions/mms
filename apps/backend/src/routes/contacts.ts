import { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import { z } from 'zod';
import { fetchCollection, persistCollection } from '../services/dbSyncService.js';
import { handleContactSaveOrUpdate, getWhatsAppPreferences } from '../services/whatsAppService.js';
import { applyTitleCaseToContact, normalizeToE164, parsePhoneNumber } from '@mms/shared';
import type { Contact, User, WhatsAppStatus } from '@mms/shared';
import { authenticateTenant } from '../middleware/authenticate.js';
import { canWriteCollection } from '../services/rbacService.js';
import { contactListSchema, contactRecordSchema } from '../validation/contactSchemas.js';

const contactBodySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['firstName'],
    additionalProperties: true,
    properties: {
      id: { type: ['string', 'number'] },
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string' },
      name: { type: 'string' },
      gender: { type: 'string' },
      dob: { type: 'string' },
      isSyed: { type: 'boolean' },
      avatar: { type: ['string', 'null'] },
      lifecycleStage: { type: 'string' },
      rating: { type: 'number' },
      phones: {
        type: 'array',
        items: {
          type: 'object',
          required: ['number'],
          properties: {
            label: { type: 'string' },
            number: { type: 'string' },
            countryCode: { type: 'string' },
          },
        },
      },
      emails: {
        type: 'array',
        items: {
          type: 'object',
          required: ['address'],
          properties: {
            label: { type: 'string' },
            address: { type: 'string' },
          },
        },
      },
      addresses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            line1: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            country: { type: 'string' },
            label: { type: 'string' },
          },
        },
      },
      socials: {
        type: 'array',
        items: {
          type: 'object',
          required: ['platform', 'url'],
          properties: {
            platform: { type: 'string' },
            url: { type: 'string' },
          },
        },
      },
      emergencyContacts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationship: { type: 'string' },
            phone: { type: 'string' },
            contactId: { type: ['string', 'number'] },
          },
        },
      },
      relationships: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            contactId: { type: ['string', 'number'] },
            relationship: { type: 'string' },
          },
        },
      },
    },
  },
};

const contactParamsSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string', minLength: 1 },
    },
  },
};

const contactIdParams = z.object({ id: z.string().min(1) });

function normalizeContactPhones(contact: Contact): Contact {
  if (!contact.phones || !Array.isArray(contact.phones)) {
    return contact;
  }
  const defaultCode = '+92';
  return {
    ...contact,
    phones: contact.phones.map((p) => {
      const e164 = normalizeToE164(p.countryCode || defaultCode, p.number);
      const parsed = parsePhoneNumber(e164, p.countryCode || defaultCode);
      return {
        ...p,
        countryCode: parsed.countryCode,
        number: parsed.number,
      };
    }),
  };
}

async function loadContacts(): Promise<Contact[]> {
  const data = await fetchCollection('contacts');
  const parsed = contactListSchema.safeParse(data ?? []);
  return parsed.success ? (parsed.data as Contact[]) : [];
}

/**
 * Server-first contact resource routes (TanStack Query on FE).
 */
export default async function contactRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/', async (_request, reply) => {
    try {
      const contacts = await loadContacts();
      return reply.send({ contacts });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to list contacts' });
    }
  });

  fastify.get('/count', async (_request, reply) => {
    try {
      const contacts = await loadContacts();
      return reply.send({ count: contacts.length });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to count contacts' });
    }
  });

  fastify.post<{ Body: Contact }>('/', { schema: contactBodySchema }, async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'contacts')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }

    try {
      const parsed = contactRecordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ type: 'validation_error', message: parsed.error.message });
      }

      const contact = normalizeContactPhones(request.body);
      const id = contact.id || `temp-${Date.now()}`;
      const contactWithId = applyTitleCaseToContact({ ...contact, id }) as Contact;

      const contacts = await loadContacts();
      const index = contacts.findIndex((c) => String(c.id) === String(id));
      if (index > -1) {
        contacts[index] = contactWithId;
      } else {
        contacts.push(contactWithId);
      }

      await persistCollection('contacts', contacts);
      await handleContactSaveOrUpdate(contactWithId);

      return reply.status(index > -1 ? 200 : 201).send({ success: true, contact: contactWithId });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save contact record';
      return reply.status(500).send({ type: 'database_error', message: msg });
    }
  });

  fastify.put<{ Params: { id: string }; Body: Contact }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'contacts')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }

    const params = contactIdParams.safeParse(request.params);
    const body = contactRecordSchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid contact payload' });
    }

    try {
      const contact = normalizeContactPhones({
        ...request.body,
        id: body.data.id ?? params.data.id,
      } as Contact);
      const contactWithId = applyTitleCaseToContact(contact) as Contact;

      const contacts = await loadContacts();
      const index = contacts.findIndex((c) => String(c.id) === params.data.id);
      if (index < 0) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }

      contacts[index] = contactWithId;
      await persistCollection('contacts', contacts);
      await handleContactSaveOrUpdate(contactWithId);

      return reply.send({ contact: contactWithId });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update contact';
      return reply.status(500).send({ type: 'database_error', message: msg });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteCollection(user, 'contacts')) {
      return reply.status(403).send({ type: 'forbidden', message: 'Insufficient permissions' });
    }

    const params = contactIdParams.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ type: 'validation_error', message: 'Invalid contact id' });
    }

    try {
      const contacts = await loadContacts();
      const next = contacts.filter((c) => String(c.id) !== params.data.id);
      if (next.length === contacts.length) {
        return reply.status(404).send({ type: 'not_found', message: 'Contact not found' });
      }
      await persistCollection('contacts', next);
      return reply.send({ success: true });
    } catch {
      return reply.status(500).send({ type: 'database_error', message: 'Failed to delete contact' });
    }
  });

  fastify.get<{ Params: { id: string } }>(
    '/:id/whatsapp-status',
    { schema: contactParamsSchema },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const contacts = await loadContacts();
        if (contacts.length === 0) {
          return reply.status(404).send({ type: 'not_found', message: 'Contact list is empty' });
        }

        const contact = contacts.find((c) => String(c.id) === String(id));
        if (!contact) {
          return reply.status(404).send({ type: 'not_found', message: `Contact with ID "${id}" not found` });
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
    },
  );
}
