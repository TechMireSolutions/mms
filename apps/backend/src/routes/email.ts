import type { FastifyInstance, FastifyPluginOptions, FastifySchema } from 'fastify';
import type { User } from '../services/authService.js';
import {
  mergeEmailIntegrationConfig,
  type EmailIntegrationConfig,
} from '@mms/shared';
import {
  loadEmailIntegrationConfig,
  markEmailIntegrationTestResult,
  saveEmailIntegrationConfig,
  saveEmailIntegrationSecrets,
} from '../services/emailIntegrationService.js';
import {
  isEmailProviderId,
  sendTenantEmail,
  verifyEmailTransport,
} from '../services/emailService.js';
import { loadGlobalSettings } from '../services/globalSettingsService.js';
import { authenticateTenant } from '../middleware/authenticate.js';

const integrationBodySchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['providerId', 'fromAddress', 'smtpUsername'],
    properties: {
      providerId: { type: 'string', minLength: 1 },
      fromAddress: { type: 'string', minLength: 3 },
      fromName: { type: 'string' },
      smtpUsername: { type: 'string', minLength: 1 },
      smtpPassword: { type: 'string' },
      smtpHost: { type: 'string' },
      smtpPort: { type: 'number' },
      smtpSecure: { type: 'boolean' },
    },
  },
};

const verificationCodeSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string', minLength: 4, maxLength: 12 },
    },
  },
};

function requireAdmin(user: User, reply: { status: (code: number) => { send: (body: unknown) => unknown } }): boolean {
  if (user.role !== 'admin') {
    reply.status(403).send({
      type: 'forbidden',
      message: 'Administrator access is required for email integration settings',
    });
    return false;
  }
  return true;
}

export default async function emailRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.addHook('preHandler', authenticateTenant);

  fastify.get('/integration', async (request, reply) => {
    const user = request.user as User;
    if (!requireAdmin(user, reply)) return;
    const config = await loadEmailIntegrationConfig();
    return reply.send(config);
  });

  fastify.put<{ Body: EmailIntegrationConfig & { smtpPassword?: string } }>(
    '/integration',
    { schema: integrationBodySchema },
    async (request, reply) => {
      const user = request.user as User;
      if (!requireAdmin(user, reply)) return;

      const body = request.body;
      if (!isEmailProviderId(body.providerId)) {
        return reply.status(400).send({
          type: 'validation_error',
          message: 'Unsupported email provider',
        });
      }

      const current = await loadEmailIntegrationConfig();
      const next = mergeEmailIntegrationConfig({
        providerId: body.providerId,
        fromAddress: body.fromAddress,
        fromName: body.fromName,
        smtpUsername: body.smtpUsername,
        smtpHost: body.smtpHost,
        smtpPort: body.smtpPort,
        smtpSecure: body.smtpSecure,
        connected: current.connected,
        hasCredentials: current.hasCredentials || Boolean(body.smtpPassword?.trim()),
        lastTestAt: current.lastTestAt,
        lastTestOk: current.lastTestOk,
        lastError: current.lastError,
      });

      if (body.smtpPassword?.trim()) {
        await saveEmailIntegrationSecrets({ smtpPassword: body.smtpPassword.trim() });
        next.hasCredentials = true;
      }

      const saved = await saveEmailIntegrationConfig(next);
      return reply.send(saved);
    },
  );

  fastify.post('/integration/test', async (request, reply) => {
    const user = request.user as User;
    if (!requireAdmin(user, reply)) return;

    const verify = await verifyEmailTransport();
    if (!verify.sent) {
      await markEmailIntegrationTestResult(false, verify.message ?? verify.reason);
      return reply.status(400).send({
        type: 'validation_error',
        message: verify.message ?? 'Email is not configured',
        reason: verify.reason,
      });
    }

    const settings = await loadGlobalSettings();
    const testSend = await sendTenantEmail(
      {
        to: user.email,
        subject: 'MMS email test',
        text: 'Your madrasa workspace email integration is working.',
      },
      settings,
    );

    if (!testSend.sent) {
      await markEmailIntegrationTestResult(false, testSend.message ?? testSend.reason);
      return reply.status(400).send({
        type: 'validation_error',
        message: testSend.message ?? 'Test email could not be sent',
        reason: testSend.reason,
      });
    }

    const saved = await markEmailIntegrationTestResult(true);
    return reply.send({ success: true, config: saved });
  });

  fastify.post<{ Body: { code: string } }>(
    '/verification-code',
    { schema: verificationCodeSchema },
    async (request, reply) => {
      const user = request.user as User;
      const settings = await loadGlobalSettings();
      const result = await sendTenantEmail(
        {
          to: user.email,
          subject: 'MMS verification code',
          text: `Your verification code is ${request.body.code}. It expires in 10 minutes.`,
        },
        settings,
      );

      if (!result.sent) {
        return reply.status(400).send({
          type: 'validation_error',
          message: result.message ?? 'Verification email could not be sent',
          reason: result.reason,
          delivered: false,
        });
      }

      return reply.send({ delivered: true, channel: 'email' });
    },
  );
}
