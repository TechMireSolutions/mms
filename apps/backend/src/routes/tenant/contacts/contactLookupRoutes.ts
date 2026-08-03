import type { FastifyPluginAsync } from 'fastify';
import {
  CONTACTS_MODULE_MANIFEST,
  contactLookupKindParamsSchema,
  contactLookupPutBodySchema,
  isContactLookupCountryKind,
  roleHasPermission,
  type User,
} from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { canReadContacts } from '../../../services/rbacService.js';
import {
  loadContactLookupsMap,
  replaceContactLookupKind,
} from '../../../services/contactLookupsService.js';
import { auditContact } from './contactRouteHelpers.js';

/** Contacts Setup lookup option lists (typed `contact_lookups`). */
export const contactLookupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/lookups', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    try {
      const lookups = await loadContactLookupsMap();
      return reply.send({ lookups });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load contact lookups', error);
    }
  });

  fastify.put('/lookups/:kind', async (request, reply) => {
    const user = request.user as User;
    if (!roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite)) {
      return sendForbidden(reply);
    }

    const params = parseRequest(contactLookupKindParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const body = parseRequest(contactLookupPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    const { kind } = params.data;
    const items = body.data.items;
    if (isContactLookupCountryKind(kind)) {
      const invalid = items.some((item) => typeof item === 'string');
      if (invalid) {
        return replyValidationError(reply, 'countryCodes items must be { country, code } objects');
      }
    } else {
      const invalid = items.some((item) => typeof item !== 'string');
      if (invalid) {
        return replyValidationError(reply, `${kind} items must be strings`);
      }
    }

    try {
      const saved = await replaceContactLookupKind(kind, items as never);
      await auditContact(
        user,
        'contact.lookups',
        `Updated contact lookup kind "${kind}" (${Array.isArray(saved) ? saved.length : 0} items)`,
        `lookups:${kind}`,
      );
      return reply.send({ success: true, kind, items: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save contact lookups', error);
    }
  });
};
