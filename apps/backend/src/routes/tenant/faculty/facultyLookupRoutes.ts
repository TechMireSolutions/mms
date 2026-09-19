import type { FastifyPluginAsync } from 'fastify';
import {
  TEACHERS_MODULE_MANIFEST,
  teacherLookupKindParamsSchema,
  teacherLookupPutBodySchema,
  type TeacherLookupKind,
} from '@mms/shared';
import { registerModuleLookupRoutes } from '../../../lib/registerModuleLookupRoutes.js';
import { canReadCollection } from '../../../services/rbacService.js';
import {
  loadFacultyLookupsMap,
  replaceFacultyLookupKind,
} from '../../../faculty/use-cases/facultyLookupsService.js';
import { auditFaculty } from './facultyRouteHelpers.js';

/** Faculty Setup lookup option lists (typed `teacher_lookups`). */
export const facultyLookupRoutes: FastifyPluginAsync = async (fastify) => {
  registerModuleLookupRoutes<TeacherLookupKind>(fastify, {
    canRead: (user) => canReadCollection(user, 'teachers'),
    setupWritePermission: TEACHERS_MODULE_MANIFEST.permissions.setupWrite,
    kindParamsSchema: teacherLookupKindParamsSchema,
    putBodySchema: teacherLookupPutBodySchema,
    loadMap: loadFacultyLookupsMap,
    replaceKind: (kind, items) => replaceFacultyLookupKind(kind, items),
    audit: auditFaculty,
    auditAction: 'teacher.lookups',
    loadError: 'Failed to load faculty lookups',
    saveError: 'Failed to save faculty lookups',
  });
};

export const teacherLookupRoutes = facultyLookupRoutes;
