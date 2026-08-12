import type { FastifyInstance } from 'fastify';
import { authenticateTenant } from '../middleware/authenticate.js';
import { auditPreHandler, auditOnResponse } from '../hooks/auditHooks.js';
import {
  listModuleTabs,
  checkValueUniqueness,
  generateFieldId,
  generateTabId,
} from '../services/dynamic-form/fieldService.js';
import { getRequestTenant } from '../lib/tenantContext.js';
import { activeDb } from '../db/dbConnection.js';
import { customFields, customTabs } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { customFieldConfigSchema } from '@mms/shared';
import { z } from 'zod';

export async function dynamicFormPlugin(app: FastifyInstance) {
  app.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateTenant);
    protectedRoutes.addHook('preHandler', auditPreHandler);
    protectedRoutes.addHook('onResponse', auditOnResponse);

    // List Tabs & Fields for Module
    protectedRoutes.get<{ Params: { module: string } }>(
      '/modules/:module/tabs',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }

        const tabs = await listModuleTabs(tenantSubdomain, request.params.module);
        return reply.send({ data: tabs });
      }
    );

    // Create Tab
    protectedRoutes.post<{ Params: { module: string } }>(
      '/modules/:module/tabs',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }

        const bodySchema = z.object({
          label: z.string().min(1),
          key: z.string().optional(),
        });
        const parsed = bodySchema.parse(request.body);

        const tabId = generateTabId();
        const tabKey = parsed.key || tabId;
        const db = activeDb();

        await db.insert(customTabs).values({
          id: tabId,
          workspaceSubdomain: tenantSubdomain,
          moduleId: request.params.module,
          key: tabKey,
          label: parsed.label,
          enabled: true,
          sortOrder: 0,
        });

        return reply.status(201).send({
          data: { id: tabId, key: tabKey, label: parsed.label, enabled: true, fields: [] },
        });
      }
    );

    // Create Field under Tab
    protectedRoutes.post<{ Params: { module: string; tabId: string } }>(
      '/modules/:module/tabs/:tabId/fields',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }

        const fieldId = generateFieldId();
        const parsed = customFieldConfigSchema.omit({ id: true, tabId: true }).parse(request.body);
        const db = activeDb();

        await db.insert(customFields).values({
          id: fieldId,
          workspaceSubdomain: tenantSubdomain,
          tabId: request.params.tabId,
          key: parsed.key || fieldId,
          label: parsed.label,
          type: parsed.type,
          enabled: parsed.enabled,
          required: parsed.required,
          unique: parsed.unique,
          placeholder: parsed.placeholder ?? null,
          description: parsed.description ?? null,
          defaultValue: parsed.defaultValue ?? null,
          options: parsed.options ?? null,
          minValue: parsed.minValue ?? null,
          maxValue: parsed.maxValue ?? null,
          mask: parsed.mask ?? null,
          allowedExtensions: parsed.allowedExtensions ?? null,
          maxFileSize: parsed.maxFileSize ?? null,
          sortOrder: parsed.sortOrder,
          hasData: false,
          isSystem: false,
        });

        return reply.status(201).send({ data: { id: fieldId, tabId: request.params.tabId, ...parsed } });
      }
    );

    // Update Field (Type lock check)
    protectedRoutes.patch<{ Params: { module: string; tabId: string; fieldId: string } }>(
      '/modules/:module/tabs/:tabId/fields/:fieldId',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }

        const db = activeDb();

        const [existing] = await db
          .select()
          .from(customFields)
          .where(
            and(
              eq(customFields.workspaceSubdomain, tenantSubdomain),
              eq(customFields.id, request.params.fieldId)
            )
          );

        if (!existing) {
          return reply.status(404).send({ type: 'not_found', message: 'Field not found' });
        }

        const body = request.body as Record<string, any>;
        if (existing.hasData && body.type && body.type !== existing.type) {
          return reply.status(422).send({
            type: 'validation_error',
            message: 'Cannot modify type of field containing active data',
          });
        }

        await db
          .update(customFields)
          .set({
            label: body.label ?? existing.label,
            type: body.type ?? existing.type,
            enabled: body.enabled ?? existing.enabled,
            required: body.required ?? existing.required,
            unique: body.unique ?? existing.unique,
            placeholder: body.placeholder ?? existing.placeholder,
            description: body.description ?? existing.description,
            options: body.options ?? existing.options,
            sortOrder: body.sortOrder ?? existing.sortOrder,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(customFields.workspaceSubdomain, tenantSubdomain),
              eq(customFields.id, request.params.fieldId)
            )
          );

        return reply.send({ data: { success: true } });
      }
    );

    // Check Uniqueness
    protectedRoutes.post<{ Params: { module: string } }>(
      '/modules/:module/fields/check-unique',
      async (request, reply) => {
        const tenantSubdomain = getRequestTenant();
        if (!tenantSubdomain) {
          return reply.status(401).send({ type: 'auth_required', message: 'Tenant required' });
        }

        const bodySchema = z.object({
          fieldKey: z.string(),
          value: z.unknown(),
        });
        const parsed = bodySchema.parse(request.body);

        const isUnique = await checkValueUniqueness(
          tenantSubdomain,
          request.params.module,
          parsed.fieldKey,
          parsed.value
        );

        return reply.send({ data: { isUnique } });
      }
    );
  });
}
