import type { FastifyInstance } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type { Permission, User } from '@mms/shared';
import { roleHasPermission } from '@mms/shared';
import { sendDatabaseError, sendForbidden } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';

export type RegisterModuleSetupConfigRoutesOptions<
  TConfig = unknown,
  TPrefs = unknown,
> = {
  canRead: (user: User) => boolean;
  setupWritePermission: Permission;
  fieldConfigSchema: ZodTypeAny;
  preferencesSchema: ZodTypeAny;
  loadFieldConfig: () => Promise<unknown>;
  saveFieldConfig: (body: TConfig) => Promise<unknown>;
  loadPreferences: () => Promise<unknown>;
  /** Normalize prefs for GET fallback and before save. */
  normalizePreferences: (partial: unknown) => TPrefs;
  savePreferences: (normalized: TPrefs) => Promise<unknown>;
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
  loadFieldConfigError?: string;
  saveFieldConfigError?: string;
  loadPreferencesError?: string;
  savePreferencesError?: string;
};

/**
 * Register GET/PUT `/field-config` + `/preferences` for module Setup.
 */
export function registerModuleSetupConfigRoutes<
  TConfig = unknown,
  TPrefs = unknown,
>(
  fastify: FastifyInstance,
  options: RegisterModuleSetupConfigRoutesOptions<TConfig, TPrefs>,
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
      return sendDatabaseError(
        reply,
        options.loadFieldConfigError ?? 'Failed to load field config',
        error,
      );
    }
  });

  fastify.put('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(options.fieldConfigSchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await options.saveFieldConfig(body.data as TConfig);
      try {
        await options.audit(
          user,
          options.fieldConfigAuditAction,
          options.fieldConfigAuditSummary,
          'field-config',
        );
      } catch (auditError) {
        fastify.log.warn({ err: auditError }, 'Failed to record field config audit log');
      }
      return reply.send({ success: true, config: saved });
    } catch (error: unknown) {
      return sendDatabaseError(
        reply,
        options.saveFieldConfigError ?? 'Failed to save field config',
        error,
      );
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
      return sendDatabaseError(
        reply,
        options.loadPreferencesError ?? 'Failed to load preferences',
        error,
      );
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
      try {
        await options.audit(
          user,
          options.preferencesAuditAction,
          options.preferencesAuditSummary,
          'preferences',
        );
      } catch (auditError) {
        fastify.log.warn({ err: auditError }, 'Failed to record preferences audit log');
      }
      return reply.send({ success: true, preferences: saved });
    } catch (error: unknown) {
      return sendDatabaseError(
        reply,
        options.savePreferencesError ?? 'Failed to save preferences',
        error,
      );
    }
  });
}

