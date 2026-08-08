import type { FastifyPluginAsync } from 'fastify';
import {
  USERS_MODULE_MANIFEST,
  userFieldConfigPutBodySchema,
  userPreferencesPutBodySchema,
  normalizeUserModulePreferences,
  type UsersSettings,
} from '@mms/shared';
import { registerModuleSetupConfigRoutes } from '../../../lib/registerModuleSetupConfigRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadUserFieldConfig,
  saveUserFieldConfig,
} from '../../../services/userConfigService.js';
import {
  loadUserModulePreferences,
  saveUserModulePreferences,
} from '../../../services/userPreferencesService.js';
import { auditUser } from './userRouteHelpers.js';

/** Users Setup field-config + preferences (typed FORCE-RLS tables). */
export const userSetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleSetupConfigRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'users'),
    setupWritePermission: USERS_MODULE_MANIFEST.permissions.setupWrite,
    fieldConfigSchema: userFieldConfigPutBodySchema,
    preferencesSchema: userPreferencesPutBodySchema,
    loadFieldConfig: loadUserFieldConfig,
    saveFieldConfig: (body) =>
      saveUserFieldConfig(body as unknown as UsersSettings),
    loadPreferences: loadUserModulePreferences,
    normalizePreferences: (partial) =>
      normalizeUserModulePreferences(partial as never),
    savePreferences: (normalized) =>
      saveUserModulePreferences(normalized as never),
    audit: auditUser,
    fieldConfigAuditAction: 'user.field-config',
    fieldConfigAuditSummary: 'Updated user field configuration',
    preferencesAuditAction: 'user.preferences',
    preferencesAuditSummary: 'Updated user module preferences',
    loadFieldConfigError: 'Failed to load user field config',
    saveFieldConfigError: 'Failed to save user field config',
    loadPreferencesError: 'Failed to load user preferences',
    savePreferencesError: 'Failed to save user preferences',
  });
};
