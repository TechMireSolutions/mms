import type { FastifyPluginAsync } from 'fastify';
import {
  CONTACTS_MODULE_MANIFEST,
  contactFieldConfigPutBodySchema,
  contactPreferencesPutBodySchema,
  normalizeContactPreferences,
  roleHasPermission,
  type FieldConfig,
  type User,
} from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { canReadContacts } from '../../../services/rbacService.js';
import {
  loadContactFieldConfig,
  saveContactFieldConfig,
} from '../../../services/contactConfigService.js';
import {
  loadContactPreferences,
  saveContactPreferences,
} from '../../../services/contactPreferencesService.js';
import { auditContact } from './contactRouteHelpers.js';

function canWriteSetup(user: User): boolean {
  return roleHasPermission(user.role, CONTACTS_MODULE_MANIFEST.permissions.setupWrite);
}

/** Contacts Setup field-config + preferences (typed FORCE-RLS tables). */
export const contactSetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    try {
      const config = await loadContactFieldConfig();
      return reply.send({ config });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load contact field config', error);
    }
  });

  fastify.put('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(contactFieldConfigPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await saveContactFieldConfig(body.data as unknown as FieldConfig);
      await auditContact(user, 'contact.field-config', 'Updated contact field configuration', 'field-config');
      return reply.send({ success: true, config: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save contact field config', error);
    }
  });

  fastify.get('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadContacts(user)) return sendForbidden(reply);
    try {
      const preferences = await loadContactPreferences();
      return reply.send({
        preferences: preferences ?? normalizeContactPreferences(null),
      });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load contact preferences', error);
    }
  });

  fastify.put('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(contactPreferencesPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await saveContactPreferences(
        normalizeContactPreferences(body.data),
      );
      await auditContact(user, 'contact.preferences', 'Updated contact preferences', 'preferences');
      return reply.send({ success: true, preferences: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save contact preferences', error);
    }
  });
};
