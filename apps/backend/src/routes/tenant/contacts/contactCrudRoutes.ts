import type { FastifyPluginAsync } from 'fastify';
import { contactWriteSchema, type Contact, type User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import { getLinkedContactId } from '../../../services/auth/userService.js';
import { contactUseCases } from '../../../contacts/use-cases/contactUseCases.js';
import { canWriteContacts, canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';

import { parseRequest } from '../../../lib/zodRequest.js';

import {
  auditContact,
  formatContactWriteError,
  sanitizeOneForUser,
  sanitizeForUser,
} from './contactRouteHelpers.js';

const s = initServer();

const RESERVED_CONTACT_ROUTE_IDS = new Set([
  'column-preferences',
  'column-prefs',
  'count',
  'metrics',
  'widget-aggregates',
  'resolve',
  'saved-reports',
  'lookups',
  'setup-config',
  'preferences',
  'field-configs',
  'google-sync',
]);

export const contactCrudRoutes: FastifyPluginAsync = async (fastify) => {
  const router = s.router(rootContract.contacts, {
    // @ts-expect-error - TS union discrimination limit with ts-rest
    list: async ({ query, request }) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = query?.includeDeleted === 'true' || query?.includeDeleted === true;
      if (includeDeleted && !canDeleteCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const effectiveQuery = {
          page: 1,
          limit: 25,
          includeDeleted: false,
          ...query,
          ...(query?.includeDeleted !== undefined ? { includeDeleted } : {}),
        };
        const result = await contactUseCases.loadContactsPage(effectiveQuery);
        const contacts = Array.isArray(result) ? result : result.contacts;
        const sanitized = await sanitizeForUser(contacts, user);
        return {
          status: 200 as const,
          body: Array.isArray(result) ? sanitized : { ...result, contacts: sanitized },
        };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list contacts' } };
      }
    },
    // @ts-expect-error - TS union discrimination limit with ts-rest
    get: async ({ params: { id }, request }) => {
      if (RESERVED_CONTACT_ROUTE_IDS.has(id)) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
      }
      const user = request.user as User;
      if (!canReadCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const contact = await contactUseCases.getContactById(id);
        if (!contact) return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
        return { status: 200 as const, body: { contact: await sanitizeOneForUser(contact, user) } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load contact' } };
      }
    },
    // @ts-expect-error - TS union discrimination limit with ts-rest
    create: async ({ body, request }) => {
      const user = request.user as User;
      if (!canWriteContacts(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const parsed = parseRequest(contactWriteSchema, body);
      if (!parsed.ok) {
        return { status: 400 as const, body: { type: 'validation_error', message: parsed.message } };
      }
      const parsedBody = parsed.data;
      const lang = ((request.headers?.['accept-language'] as string | undefined) || 'en');
      
      try {
        const { contact, created, restoredFromDelete } = await contactUseCases.upsertContact(parsedBody as Contact, { user, language: lang });
        if (restoredFromDelete) {
          await auditContact(user, 'contact.restore', `Restored contact ${String(contact.id)} via upsert`, String(contact.id));
        } else {
          await auditContact(user, created ? 'contact.create' : 'contact.upsert', `${created ? 'Created' : 'Updated'} contact ${String(contact.id)}`, String(contact.id));
        }
        return { status: created ? (201 as const) : (200 as const), body: { success: true, contact: await sanitizeOneForUser(contact, user) } };
      } catch (error: unknown) {
        return formatContactWriteError(error, 'Failed to save contact record');
      }
    },
    // @ts-expect-error - TS union discrimination limit with ts-rest
    update: async ({ params: { id }, body, request }) => {
      if (RESERVED_CONTACT_ROUTE_IDS.has(id)) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
      }
      const user = request.user as User;
      const linkedContactId = await getLinkedContactId(user.id);
      const isOwnContact = linkedContactId != null && String(linkedContactId) === id;
      if (!isOwnContact && !canWriteContacts(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const parsed = parseRequest(contactWriteSchema, body);
      if (!parsed.ok) {
        return { status: 400 as const, body: { type: 'validation_error', message: parsed.message } };
      }
      const parsedBody = parsed.data;
      const lang = ((request.headers?.['accept-language'] as string | undefined) || 'en');
      
      try {
        const updatePayload = { ...(parsedBody && typeof parsedBody === 'object' ? parsedBody : {}), id } as Contact;
        const updated = await contactUseCases.updateContactById(id, updatePayload, { language: lang, applyRelationshipInference: canWriteContacts(user) });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
        await auditContact(user, 'contact.update', `Updated contact ${id}`, id);
        return { status: 200 as const, body: { success: true, contact: await sanitizeOneForUser(updated, user) } };
      } catch (error: unknown) {
        return formatContactWriteError(error, 'Failed to update contact');
      }
    },
    // @ts-expect-error - TS union discrimination limit with ts-rest
    delete: async ({ params: { id }, body, request }) => {
      if (RESERVED_CONTACT_ROUTE_IDS.has(id)) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
      }
      const user = request.user as User;
      if (!canDeleteCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const deleted = await contactUseCases.softDeleteContactById(
          id,
          String(user.id),
          (body as { deletionReason?: string } | undefined)?.deletionReason,
        );
        if (!deleted) return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
        await auditContact(user, 'contact.soft_delete', `Soft-deleted contact ${id}`, id);
        return { status: 200 as const, body: { success: true } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to delete contact' } };
      }
    },
    // @ts-expect-error - TS union discrimination limit with ts-rest
    reportAnalytics: async ({ query, request }) => {
      const user = request.user as User;
      if (!canReadCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const result = await contactUseCases.loadContactsReportAnalytics({
          compareYears: query.years as number[],
          language: query.lang as string | undefined,
        });
        return { status: 200 as const, body: result };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load contact report analytics' } };
      }
    },
  });

  await fastify.register(s.plugin(router));
};
