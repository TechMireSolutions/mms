import type { FastifyPluginAsync } from 'fastify';
import {
  CONTACTS_MODULE_MANIFEST,
  contactFieldConfigPutBodySchema,
  contactPreferencesPutBodySchema,
  normalizeContactPreferences,
  type FieldConfig,
} from '@mms/shared';
import { registerModuleSetupConfigRoutes } from '../../../lib/registerModuleSetupConfigRoutes.js';
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

/** Contacts Setup field-config + preferences (typed FORCE-RLS tables). */
export const contactSetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleSetupConfigRoutes(fastify, {
    canRead: canReadContacts,
    setupWritePermission: CONTACTS_MODULE_MANIFEST.permissions.setupWrite,
    fieldConfigSchema: contactFieldConfigPutBodySchema,
    preferencesSchema: contactPreferencesPutBodySchema,
    loadFieldConfig: loadContactFieldConfig,
    saveFieldConfig: (body) => saveContactFieldConfig(body as unknown as FieldConfig),
    loadPreferences: loadContactPreferences,
    normalizePreferences: (partial) =>
      normalizeContactPreferences(partial as never),
    savePreferences: (normalized) =>
      saveContactPreferences(normalized as never),
    audit: (user, action, summary, entityId) =>
      auditContact(user, action, summary, entityId),
    fieldConfigAuditAction: 'contact.field-config',
    fieldConfigAuditSummary: 'Updated contact field configuration',
    preferencesAuditAction: 'contact.preferences',
    preferencesAuditSummary: 'Updated contact preferences',
    loadFieldConfigError: 'Failed to load contact field config',
    saveFieldConfigError: 'Failed to save contact field config',
    loadPreferencesError: 'Failed to load contact preferences',
    savePreferencesError: 'Failed to save contact preferences',
  });
};
