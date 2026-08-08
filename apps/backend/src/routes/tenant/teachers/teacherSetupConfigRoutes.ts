import type { FastifyPluginAsync } from 'fastify';
import {
  TEACHERS_MODULE_MANIFEST,
  teacherFieldConfigPutBodySchema,
  teacherPreferencesPutBodySchema,
  normalizeTeacherModulePreferences,
  type TeachersSettings,
} from '@mms/shared';
import { registerModuleSetupConfigRoutes } from '../../../lib/registerModuleSetupConfigRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadTeacherFieldConfig,
  saveTeacherFieldConfig,
} from '../../../services/teacherConfigService.js';
import {
  loadTeacherModulePreferences,
  saveTeacherModulePreferences,
} from '../../../services/teacherPreferencesService.js';
import { auditTeacher } from './teacherRouteHelpers.js';

/** Teachers Setup field-config + preferences (typed FORCE-RLS tables). */
export const teacherSetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleSetupConfigRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    setupWritePermission: TEACHERS_MODULE_MANIFEST.permissions.setupWrite,
    fieldConfigSchema: teacherFieldConfigPutBodySchema,
    preferencesSchema: teacherPreferencesPutBodySchema,
    loadFieldConfig: loadTeacherFieldConfig,
    saveFieldConfig: (body) =>
      saveTeacherFieldConfig(body as unknown as TeachersSettings),
    loadPreferences: loadTeacherModulePreferences,
    normalizePreferences: (partial) =>
      normalizeTeacherModulePreferences(partial as never),
    savePreferences: (normalized) =>
      saveTeacherModulePreferences(normalized as never),
    audit: auditTeacher,
    fieldConfigAuditAction: 'teacher.field-config',
    fieldConfigAuditSummary: 'Updated teacher field configuration',
    preferencesAuditAction: 'teacher.preferences',
    preferencesAuditSummary: 'Updated teacher module preferences',
    loadFieldConfigError: 'Failed to load teacher field config',
    saveFieldConfigError: 'Failed to save teacher field config',
    loadPreferencesError: 'Failed to load teacher preferences',
    savePreferencesError: 'Failed to save teacher preferences',
  });
};
