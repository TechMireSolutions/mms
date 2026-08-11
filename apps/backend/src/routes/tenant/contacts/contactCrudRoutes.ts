import type { FastifyPluginAsync } from 'fastify';
import type { Contact, User } from '@mms/shared';
import { summarizeContactFieldChanges } from '@mms/shared';
import { getLinkedContactId } from '../../../services/auth/userService.js';
import { contactUseCases } from '../../../contacts/use-cases/contactUseCases.js';
import { ContactPermissionError, ContactUniqueFieldError } from '../../../services/contactService.js';
import { validateContactDynamic } from '../../../services/contactValidationService.js';
import { canWriteContacts } from '../../../services/rbacService.js';
import { sendDatabaseError, sendForbidden, sendNotFound } from '../../../lib/httpErrors.js';
import { executeDynamicValidation, parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { resourceIdParamsSchema } from '../../../validation/commonSchemas.js';
import {
  auditContact,
  parseContactWriteBody,
  requireContactPermission,
  sanitizeOneForUser,
} from './contactRouteHelpers.js';

/** Fields a linked user may update on their own contact without contacts.write. */
const ALLOWED_SELF_CONTACT_FIELDS = new Set([
  'id',
  '_blueprintId',
  'firstName',
  'lastName',
  'name',
  'gender',
  'dob',
  'cnic',
  'isSyed',
  'avatar',
  'preferredLanguage',
  'preferredContactMethod',
  'phones',
  'emails',
  'addresses',
  'socials',
  'relationshipContacts',
  'phone',
  'email',
  'city',
  'state',
  'country',
]);

/** Contact create / read-by-id / update routes. */
export const contactCrudRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', {
    bodyLimit: 1048576,
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    if (!requireContactPermission(reply, user, 'write')) return;

    const parsed = await parseContactWriteBody(request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);

    const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
      validateContactDynamic(tenant, parsed.data, lang, user.role)
    );
    if (!isValid) return;

    const lang = (request.headers['accept-language'] as string) || 'en';

    try {
      const { contact, created, restoredFromDelete } = await contactUseCases.upsertContact(parsed.data as Contact, {
        user,
        language: lang,
      });
      if (restoredFromDelete) {
        await auditContact(user, 'contact.restore', `Restored contact ${String(contact.id)} via upsert`, String(contact.id));
      } else {
        await auditContact(
          user,
          created ? 'contact.create' : 'contact.upsert',
          `${created ? 'Created' : 'Updated'} contact ${String(contact.id)}`,
          String(contact.id),
        );
      }
      return reply
        .status(created ? 201 : 200)
        .send({ success: true, contact: await sanitizeOneForUser(contact, user) });
    } catch (error: unknown) {
      if (error instanceof ContactPermissionError) {
        return sendForbidden(reply, error.message);
      }
      if (error instanceof ContactUniqueFieldError) {
        return replyValidationError(reply, error.message, { errors: error.errors });
      }
      return sendDatabaseError(reply, 'Failed to save contact record', error);
    }
  });

  fastify.get('/:id', async (request, reply) => {
    const user = request.user as User;
    if (!requireContactPermission(reply, user, 'read')) return;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);
    try {
      const contact = await contactUseCases.getContactById(params.data.id);
      if (!contact) {
        return sendNotFound(reply, 'Contact not found');
      }
      return reply.send({ contact: await sanitizeOneForUser(contact, user) });
    } catch {
      return sendDatabaseError(reply, 'Failed to load contact');
    }
  });

  fastify.put('/:id', {
    bodyLimit: 1048576,
    schema: { body: { type: 'object', additionalProperties: true } },
  }, async (request, reply) => {
    const user = request.user as User;
    const params = parseRequest(resourceIdParamsSchema, request.params);
    if (!params.ok) return replyValidationError(reply, params.message);

    const linkedContactId = await getLinkedContactId(user.id);
    const isOwnContact =
      linkedContactId != null && String(linkedContactId) === params.data.id;
    if (!isOwnContact && !canWriteContacts(user)) {
      return sendForbidden(reply);
    }
    const before = await contactUseCases.getContactById(params.data.id);
    if (!before) {
      return sendNotFound(reply, 'Contact not found');
    }

    const body = await parseContactWriteBody(request.body);
    if (!body.ok) return replyValidationError(reply, body.message);

    if (isOwnContact && !canWriteContacts(user)) {
      const modifiedRestrictedFields = Object.keys(body.data).filter((key) => {
        if (ALLOWED_SELF_CONTACT_FIELDS.has(key)) return false;
        const beforeVal = (before as Record<string, unknown>)[key];
        const newVal = (body.data as Record<string, unknown>)[key];
        return JSON.stringify(beforeVal) !== JSON.stringify(newVal);
      });
      if (modifiedRestrictedFields.length > 0) {
        return sendForbidden(reply, 'Cannot update restricted contact fields');
      }
    }

    const isValid = await executeDynamicValidation(request, reply, (tenant, lang) =>
      validateContactDynamic(tenant, body.data, lang, user.role)
    );
    if (!isValid) return;

    const lang = (request.headers['accept-language'] as string) || 'en';

    try {
      const isSelfService = isOwnContact && !canWriteContacts(user);
      const updated = await contactUseCases.updateContactById(
        params.data.id,
        {
          ...body.data,
          id: body.data.id ?? params.data.id,
        } as Contact,
        {
          language: lang,
          // Non-writers must not rewrite peer relationship graphs via inference.
          applyRelationshipInference: !isSelfService,
        },
      );
      if (!updated) {
        return sendNotFound(reply, 'Contact not found');
      }
      const diff = before ? summarizeContactFieldChanges(before, updated) : `Updated contact ${params.data.id}`;
      await auditContact(user, 'contact.update', diff, params.data.id);
      return reply.send({ success: true, contact: await sanitizeOneForUser(updated, user) });
    } catch (error: unknown) {
      if (error instanceof ContactUniqueFieldError) {
        return replyValidationError(reply, error.message, { errors: error.errors });
      }
      return sendDatabaseError(reply, 'Failed to update contact', error);
    }
  });
};
