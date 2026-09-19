import type { FastifyPluginAsync } from 'fastify';
import {
  TEACHERS_MODULE_MANIFEST,
  teacherFieldConfigPutBodySchema,
  teacherPreferencesPutBodySchema,
  normalizeTeacherModulePreferences,
} from '@mms/shared';
import { registerModuleSetupConfigRoutes } from '../../../lib/registerModuleSetupConfigRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadFacultyFieldConfig,
  saveFacultyFieldConfig,
} from '../../../faculty/use-cases/facultyConfigService.js';
import {
  loadFacultyModulePreferences,
  saveFacultyModulePreferences,
} from '../../../faculty/use-cases/facultyPreferencesService.js';
import { auditFaculty } from './facultyRouteHelpers.js';

/** Faculty Setup field-config + preferences (typed FORCE-RLS tables). */
export const facultySetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleSetupConfigRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    setupWritePermission: TEACHERS_MODULE_MANIFEST.permissions.setupWrite,
    fieldConfigSchema: teacherFieldConfigPutBodySchema,
    preferencesSchema: teacherPreferencesPutBodySchema,
    loadFieldConfig: loadFacultyFieldConfig,
    saveFieldConfig: (body) => saveFacultyFieldConfig(body),
    loadPreferences: loadFacultyModulePreferences,
    normalizePreferences: normalizeTeacherModulePreferences,
    savePreferences: saveFacultyModulePreferences,
    audit: auditFaculty,
    fieldConfigAuditAction: 'teacher.field-config',
    fieldConfigAuditSummary: 'Updated teacher field configuration',
    preferencesAuditAction: 'teacher.preferences',
    preferencesAuditSummary: 'Updated teacher module preferences',
    loadFieldConfigError: 'Failed to load faculty field config',
    saveFieldConfigError: 'Failed to save faculty field config',
    loadPreferencesError: 'Failed to load faculty preferences',
    savePreferencesError: 'Failed to save faculty preferences',
  });
};

export const teacherSetupConfigRoutes = facultySetupConfigRoutes;
