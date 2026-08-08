import type { FastifyPluginAsync } from 'fastify';
import {
  TEACHERS_MODULE_MANIFEST,
  teacherLookupKindParamsSchema,
  teacherLookupPutBodySchema,
} from '@mms/shared';
import { registerModuleLookupRoutes } from '../../../lib/registerModuleLookupRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadTeacherLookupsMap,
  replaceTeacherLookupKind,
} from '../../../services/teacherLookupsService.js';
import { auditTeacher } from './teacherRouteHelpers.js';

/** Teachers Setup lookup option lists (typed `teacher_lookups`). */
export const teacherLookupRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleLookupRoutes(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    setupWritePermission: TEACHERS_MODULE_MANIFEST.permissions.setupWrite,
    kindParamsSchema: teacherLookupKindParamsSchema,
    putBodySchema: teacherLookupPutBodySchema,
    loadMap: loadTeacherLookupsMap,
    replaceKind: (kind, items) =>
      replaceTeacherLookupKind(kind as never, items as never) as Promise<unknown>,
    audit: auditTeacher,
    auditAction: 'teacher.lookups',
    loadError: 'Failed to load teacher lookups',
    saveError: 'Failed to save teacher lookups',
  });
};
