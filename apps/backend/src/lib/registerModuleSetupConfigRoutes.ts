import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type { Permission, User } from '@mms/shared';
import { roleHasPermission } from '@mms/shared';
import { sendDatabaseError, sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';

export type RegisterModuleSetupConfigRoutesOptions = {
  canRead: (user: User) => boolean;
  setupWritePermission: Permission;
  fieldConfigSchema: ZodTypeAny;
  preferencesSchema: ZodTypeAny;
  loadFieldConfig: () => Promise<unknown>;
  saveFieldConfig: (body: unknown) => Promise<unknown>;
  loadPreferences: () => Promise<unknown>;
  /** Normalize prefs for GET fallback and before save. */
  normalizePreferences: (partial: unknown) => unknown;
  savePreferences: (normalized: unknown) => Promise<unknown>;
  audit: (
    user: User,
    action: string,
    summary: string,
    entityId: string,
  ) => Promise<void>;
  fieldConfigAuditAction: string;
  fieldConfigAuditSummary: string;
  preferencesAuditAction: string;
  preferencesAuditSummary: string;
  loadFieldConfigError: string;
  saveFieldConfigError: string;
  loadPreferencesError: string;
  savePreferencesError: string;
};

/**
 * Register GET/PUT `/field-config` + `/preferences` for module Setup.
 */
export function registerModuleSetupConfigRoutes(
  fastify: FastifyInstance,
  options: RegisterModuleSetupConfigRoutesOptions,
): void {
  const canWriteSetup = (user: User) =>
    roleHasPermission(user.role, options.setupWritePermission);

  fastify.get('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);
    try {
      const config = await options.loadFieldConfig();
      return reply.send({ config });
    } catch (error: unknown) {
      return sendDatabaseError(reply, options.loadFieldConfigError, error);
    }
  });

  fastify.put('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(options.fieldConfigSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await options.saveFieldConfig(body.data);
      await options.audit(
        user,
        options.fieldConfigAuditAction,
        options.fieldConfigAuditSummary,
        'field-config',
      );
      return reply.send({ success: true, config: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, options.saveFieldConfigError, error);
    }
  });

  fastify.get('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!options.canRead(user)) return sendForbidden(reply);
    try {
      const preferences = await options.loadPreferences();
      return reply.send({
        preferences: preferences ?? options.normalizePreferences(null),
      });
    } catch (error: unknown) {
      return sendDatabaseError(reply, options.loadPreferencesError, error);
    }
  });

  fastify.put('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(options.preferencesSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await options.savePreferences(
        options.normalizePreferences(body.data),
      );
      await options.audit(
        user,
        options.preferencesAuditAction,
        options.preferencesAuditSummary,
        'preferences',
      );
      return reply.send({ success: true, preferences: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, options.savePreferencesError, error);
    }
  });
}
