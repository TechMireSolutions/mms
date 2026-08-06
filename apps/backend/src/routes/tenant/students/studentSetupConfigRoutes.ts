import type { FastifyPluginAsync } from 'fastify';
import {
  STUDENTS_MODULE_MANIFEST,
  studentFieldConfigPutBodySchema,
  studentPreferencesPutBodySchema,
  normalizeStudentModulePreferences,
  roleHasPermission,
  type StudentsSettings,
  type User,
} from '@mms/shared';
import { sendDatabaseError, sendForbidden } from '../../../lib/httpErrors.js';
import { parseRequest, replyValidationError } from '../../../lib/zodRequest.js';
import { canReadCollection } from '../../../services/rbacService.js';
import { recordAudit } from '../../../services/auditService.js';
import {
  loadStudentFieldConfig,
  saveStudentFieldConfig,
} from '../../../services/studentConfigService.js';
import {
  loadStudentModulePreferences,
  saveStudentModulePreferences,
} from '../../../services/studentPreferencesService.js';

function canWriteSetup(user: User): boolean {
  return roleHasPermission(user.role, STUDENTS_MODULE_MANIFEST.permissions.setupWrite);
}

async function auditStudentSetup(
  user: User,
  action: string,
  summary: string,
  entityId: string,
): Promise<void> {
  await recordAudit({
    userId: user.id,
    userEmail: user.email,
    action,
    entityType: 'collection',
    entityId,
    summary,
  });
}

/** Students Setup field-config + preferences (typed FORCE-RLS tables). */
export const studentSetupConfigRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const config = await loadStudentFieldConfig();
      return reply.send({ config });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load student field config', error);
    }
  });

  fastify.put('/field-config', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(studentFieldConfigPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await saveStudentFieldConfig(body.data as unknown as StudentsSettings);
      await auditStudentSetup(
        user,
        'student.field-config',
        'Updated student field configuration',
        'field-config',
      );
      return reply.send({ success: true, config: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save student field config', error);
    }
  });

  fastify.get('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canReadCollection(user, 'students')) return sendForbidden(reply);
    try {
      const preferences = await loadStudentModulePreferences();
      return reply.send({
        preferences: preferences ?? normalizeStudentModulePreferences(null),
      });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to load student preferences', error);
    }
  });

  fastify.put('/preferences', async (request, reply) => {
    const user = request.user as User;
    if (!canWriteSetup(user)) return sendForbidden(reply);
    const body = parseRequest(studentPreferencesPutBodySchema, request.body);
    if (!body.ok) return replyValidationError(reply, body.message);
    try {
      const saved = await saveStudentModulePreferences(
        normalizeStudentModulePreferences(body.data),
      );
      await auditStudentSetup(
        user,
        'student.preferences',
        'Updated student module preferences',
        'preferences',
      );
      return reply.send({ success: true, preferences: saved });
    } catch (error: unknown) {
      return sendDatabaseError(reply, 'Failed to save student preferences', error);
    }
  });
};
