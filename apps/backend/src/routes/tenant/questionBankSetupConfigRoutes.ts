import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticateTenant } from '../../middleware/authenticate.js';
import {
  questionBankFieldConfigPutBodySchema,
  questionBankPreferencesPutBodySchema,
  composeQuestionBankSettings,
  normalizeQuestionBankModulePreferences,
  normalizeQuestionBankFieldConfigOnly,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { parseRequest, replyValidationError } from '../../lib/zodRequest.js';
import {
  getQuestionBankFieldConfig,
  updateQuestionBankFieldConfig,
} from '../../services/questionBankConfigService.js';
import {
  getQuestionBankPreferences,
  updateQuestionBankPreferences,
} from '../../services/questionBankPreferencesService.js';

export const questionBankSetupConfigRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  fastify.addHook('onRequest', authenticateTenant);

  fastify.get('/config/fields', async (request, reply) => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('No tenant');
    const raw = await getQuestionBankFieldConfig(tenant);
    const normalized = normalizeQuestionBankFieldConfigOnly(raw);
    return reply.send(normalized);
  });

  fastify.put('/config/fields', async (request, reply) => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('No tenant');
    
    const parsed = parseRequest(questionBankFieldConfigPutBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    
    await updateQuestionBankFieldConfig(
      tenant,
      parsed.data as Record<string, unknown>,
    );
      
      const updatedFields = await getQuestionBankFieldConfig(tenant);
      const normalizedFields = normalizeQuestionBankFieldConfigOnly(updatedFields);
      return reply.send(normalizedFields);
    },
  );

  fastify.get('/config/preferences', async (request, reply) => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('No tenant');
    const raw = await getQuestionBankPreferences(tenant);
    const normalized = normalizeQuestionBankModulePreferences(raw);
    return reply.send(normalized);
  });

  fastify.put('/config/preferences', async (request, reply) => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('No tenant');
    
    const parsed = parseRequest(questionBankPreferencesPutBodySchema, request.body);
    if (!parsed.ok) return replyValidationError(reply, parsed.message);
    
    await updateQuestionBankPreferences(
      tenant,
      parsed.data as Record<string, unknown>,
    );
      const updatedPrefs = await getQuestionBankPreferences(tenant);
      const normalizedPrefs = normalizeQuestionBankModulePreferences(updatedPrefs);
      return reply.send(normalizedPrefs);
    },
  );

  fastify.get('/config/composed', async (request, reply) => {
    const tenant = getRequestTenant();
    if (!tenant) throw new Error('No tenant');
    const [rawFields, rawPrefs] = await Promise.all([
      getQuestionBankFieldConfig(tenant),
      getQuestionBankPreferences(tenant),
    ]);

    const fieldConfig = normalizeQuestionBankFieldConfigOnly(rawFields);
    const prefs = normalizeQuestionBankModulePreferences(rawPrefs);
    const composed = composeQuestionBankSettings(fieldConfig, prefs);
    return reply.send(composed);
  });
};
