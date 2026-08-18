import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import { requireTenantModule } from '../../middleware/requireTenantModule.js';
import {
  EXAMINATIONS_MODULE_MANIFEST,
  examListSchema,
  examResultListSchema,
} from '@mms/shared';
import {
  registerBulkRoutes,
  registerMetricsRoute,
  registerSoftDeletableBulkRoutes,
} from '../../lib/crudRouter.js';
import {
  loadExams,
  loadExamsPage,
  upsertExams,
  loadExamResults,
  upsertExamResults,
  deleteExamById,
  restoreExamById,
  bulkSoftDeleteExams,
  bulkRestoreExams,
  loadExaminationsCommandMetrics,
} from '../../services/examinationService.js';

import { examinationSetupConfigRoutes } from './examinationSetupConfigRoutes.js';
import { examinationsListQuerySchema } from '../../validation/examinationsSchemas.js';

const EXAMS_COLLECTION = EXAMINATIONS_MODULE_MANIFEST.collectionKey;
const RESULTS_COLLECTION = EXAMINATIONS_MODULE_MANIFEST.resultsCollectionKey;

/**
 * Examinations module routes — upsert bulk + soft-delete exams.
 */
export default async function examinationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);
  fastify.addHook('preHandler', requireTenantModule('examination'));

  fastify.register(examinationSetupConfigRoutes);

  registerMetricsRoute(fastify, {
    collection: EXAMS_COLLECTION,
    loadMetricsFn: loadExaminationsCommandMetrics,
    errorMessagePrefix: 'examination',
  });

  registerSoftDeletableBulkRoutes(fastify, {
    path: '/exams',
    collection: EXAMS_COLLECTION,
    schema: examListSchema,
    loadFn: loadExams,
    loadPageFn: loadExamsPage,
    listQuerySchema: examinationsListQuerySchema,
    defaultPageSize: EXAMINATIONS_MODULE_MANIFEST.defaultPageSize,
    saveFn: upsertExams,
    deleteFn: deleteExamById,
    restoreFn: restoreExamById,
    bulkDeleteFn: bulkSoftDeleteExams,
    bulkRestoreFn: bulkRestoreExams,
    responseKey: 'exams',
    errorMessagePrefix: 'exams',
    nameSingular: 'Exam',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_MANIFEST.examColumnPreferencesObjectKey,
  });

  registerBulkRoutes(fastify, {
    path: '/results',
    collection: RESULTS_COLLECTION,
    schema: examResultListSchema,
    loadFn: loadExamResults,
    saveFn: upsertExamResults,
    responseKey: 'results',
    errorMessagePrefix: 'exam results',
    columnPreferencesObjectKey: EXAMINATIONS_MODULE_MANIFEST.resultsColumnPreferencesObjectKey,
  });
}
