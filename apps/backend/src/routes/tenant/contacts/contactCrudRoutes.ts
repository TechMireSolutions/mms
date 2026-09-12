import type { FastifyPluginAsync } from 'fastify';
import { isQueryFlagTrue, type Contact, type User } from '@mms/shared';
import { rootContract } from '@mms/shared';
import { initServer } from '@ts-rest/fastify';
import type { ContractRouteArgs, ContractRouteResponse } from '../../../lib/contractRouterTypes.js';
import { getLinkedContactId } from '../../../services/auth/userService.js';
import { contactUseCases } from '../../../contacts/use-cases/contactUseCases.js';
import { canWriteContacts, canReadCollection, canDeleteCollection } from '../../../services/rbacService.js';
import { replyValidationError } from '../../../lib/zodRequest.js';

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
    list: async ({ query, request }: ContractRouteArgs<typeof rootContract['contacts']['list']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['list']>> => {
      const user = request.user as User;
      if (!canReadCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      try {
        const effectiveQuery = {
          page: 1,
          limit: 25,
          ...query,
          includeDeleted,
        };
        const result = await contactUseCases.loadContactsPage(effectiveQuery);
        const contacts = result.contacts;
        const sanitized = await sanitizeForUser(contacts, user);
        return {
          status: 200 as const,
          body: { ...result, contacts: sanitized },
        };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to list contacts' } };
      }
    },
    get: async ({ params: { id }, query, request }: ContractRouteArgs<typeof rootContract['contacts']['get']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['get']>> => {
      if (RESERVED_CONTACT_ROUTE_IDS.has(id)) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
      }
      const user = request.user as User;
      if (!canReadCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const includeDeleted = isQueryFlagTrue(query?.includeDeleted);
      if (includeDeleted && !canDeleteCollection(user, 'contacts')) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Viewing deleted contacts requires delete permissions' } };
      }
      try {
        const contact = await contactUseCases.getContactById(id, includeDeleted);
        if (!contact || (!includeDeleted && contact.deletedAt != null)) {
          return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
        }
        return { status: 200 as const, body: { contact: await sanitizeOneForUser(contact, user) } };
      } catch (error) {
        return { status: 500 as const, body: { type: 'database_error', message: 'Failed to load contact' } };
      }
    },
    create: async ({ body, request }: ContractRouteArgs<typeof rootContract['contacts']['create']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['create']>> => {
      const user = request.user as User;
      if (!canWriteContacts(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const lang = ((request.headers?.['accept-language'] as string | undefined) || 'en');
      
      try {
        const { contact, created, restoredFromDelete } = await contactUseCases.upsertContact(body as unknown as Contact, { user, language: lang });
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
    update: async ({ params: { id }, body, request }: ContractRouteArgs<typeof rootContract['contacts']['update']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['update']>> => {
      if (RESERVED_CONTACT_ROUTE_IDS.has(id)) {
        return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
      }
      const user = request.user as User;
      const linkedContactId = await getLinkedContactId(user.id);
      const isOwnContact = linkedContactId != null && String(linkedContactId) === id;
      if (!isOwnContact && !canWriteContacts(user)) {
        return { status: 403 as const, body: { type: 'forbidden', message: 'Insufficient permissions' } };
      }
      const lang = ((request.headers?.['accept-language'] as string | undefined) || 'en');
      
      try {
        const updatePayload = { ...(body && typeof body === 'object' ? body : {}), id } as unknown as Contact;
        const updated = await contactUseCases.updateContactById(id, updatePayload, { language: lang, applyRelationshipInference: canWriteContacts(user) });
        if (!updated) return { status: 404 as const, body: { type: 'not_found', message: 'Contact not found' } };
        await auditContact(user, 'contact.update', `Updated contact ${id}`, id);
        return { status: 200 as const, body: { success: true, contact: await sanitizeOneForUser(updated, user) } };
      } catch (error: unknown) {
        return formatContactWriteError(error, 'Failed to update contact');
      }
    },
    delete: async ({ params: { id }, body, request }: ContractRouteArgs<typeof rootContract['contacts']['delete']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['delete']>> => {
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
    reportAnalytics: async ({ query, request }: ContractRouteArgs<typeof rootContract['contacts']['reportAnalytics']>): Promise<ContractRouteResponse<typeof rootContract['contacts']['reportAnalytics']>> => {
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
  } as unknown as Parameters<typeof s.router>[1]);

  await fastify.register(s.plugin(router), {
    requestValidationErrorHandler: (err, _request, reply) => {
      const zErr = err.body ?? err.query ?? err.pathParams ?? err.headers;
      const message = zErr instanceof Error ? zErr.message : err.message;
      void replyValidationError(reply, message);
    },
  });
};
