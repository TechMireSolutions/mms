import { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodType } from 'zod';

import type { User } from '@mms/shared';
import { registerColumnPreferencesRoutes } from './columnPreferencesRouter.js';
import type { ResourceRecord } from './crudRouterTypes.js';
import {
  registerCountRoute,
  registerLinkedContactIdsRoute,
  registerMetricsRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
} from './crudQueryRoutes.js';
import { registerPaginatedListRoute } from './crudPaginatedRoutes.js';
import { registerResourceRoutes } from './crudResourceRoutes.js';

export interface StandardExtendedRoutesOptions<TQuery, TRecord> {
  prefix?: string;
  collection: string;
  listQuerySchema?: ZodType<TQuery>;
  defaultPageSize?: number;
  errorMessagePrefix: string;
  nameSingular: string;
  loadPageFn?: (query: TQuery & { includeDeleted: boolean }) => Promise<unknown>;
  loadAllFn: (options?: { includeDeleted?: boolean }) => Promise<TRecord[]>;
  /** Prefer SQL count — avoids hydrate-all for `/count`. */
  loadCountFn?: () => Promise<number>;
  computeMetricsFn?: (records: TRecord[], request: FastifyRequest) => Promise<unknown> | unknown;
  /** Prefer SQL aggregates — avoids hydrate-all for `/metrics`. */
  loadMetricsFn?: (request: FastifyRequest) => Promise<unknown>;
  loadWidgetAggregatesFn?: (queries: unknown[]) => Promise<unknown>;
  loadByIdsFn?: (ids: string[]) => Promise<TRecord[]>;
  loadLinkedContactIdsFn?: (excludeId?: string) => Promise<(string | number)[]>;
  columnPreferencesObjectKey?: string;
  canWriteDeletedCheck?: (user: User) => boolean;
}

/**
 * Registers standard extended routes (Paginated List, Count, Metrics, Widget Aggregates, Resolve, Linked Contact IDs, Column Preferences).
 */
export function registerStandardExtendedRoutes<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string } = Record<string, unknown>,
  TRecord = unknown,
>(
  fastify: FastifyInstance,
  options: StandardExtendedRoutesOptions<TQuery, TRecord>,
): void {
  const {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    loadPageFn,
    loadAllFn,
    loadCountFn,
    computeMetricsFn,
    loadMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
    canWriteDeletedCheck,
  } = options;

  if (listQuerySchema && loadPageFn) {
    registerPaginatedListRoute(fastify, {
      path: prefix || '/',
      collection,
      schema: listQuerySchema,
      defaultPageSize: defaultPageSize ?? 20,
      errorMessagePrefix,
      canWriteDeletedCheck,
      loadPageFn,
    });
  }

  registerCountRoute(fastify, {
    path: prefix ? `${prefix}/count` : '/count',
    collection,
    loadCountFn,
    loadAllFn: loadCountFn ? undefined : () => loadAllFn(),
    errorMessagePrefix,
  });

  if (loadMetricsFn || computeMetricsFn) {
    registerMetricsRoute(fastify, {
      path: prefix ? `${prefix}/metrics` : '/metrics',
      collection,
      loadMetricsFn: async (request) => {
        if (loadMetricsFn) return loadMetricsFn(request);
        const records = await loadAllFn();
        return computeMetricsFn!(records, request);
      },
      errorMessagePrefix: nameSingular,
    });
  }

  if (loadWidgetAggregatesFn) {
    registerWidgetAggregatesRoute(fastify, {
      path: prefix ? `${prefix}/widget-aggregates` : '/widget-aggregates',
      collection,
      loadAggregatesFn: loadWidgetAggregatesFn,
      errorMessagePrefix: nameSingular,
    });
  }

  if (loadByIdsFn) {
    registerResolveRoute(fastify, {
      path: prefix ? `${prefix}/resolve` : '/resolve',
      collection,
      loadByIdsFn: loadByIdsFn,
      responseKey: errorMessagePrefix,
      errorMessagePrefix,
    });
  }

  if (loadLinkedContactIdsFn) {
    registerLinkedContactIdsRoute(fastify, {
      path: prefix ? `${prefix}/linked-contact-ids` : '/linked-contact-ids',
      collection,
      loadLinkedContactIdsFn,
      errorMessagePrefix,
    });
  }

  if (columnPreferencesObjectKey) {
    registerColumnPreferencesRoutes(fastify, {
      path: prefix ? `${prefix}/column-preferences` : '/column-preferences',
      collection,
      objectKey: columnPreferencesObjectKey,
    });
  }
}

export interface StandardTenantRoutesOptions<TQuery, TRecord extends ResourceRecord>
  extends StandardExtendedRoutesOptions<TQuery, TRecord> {
  schema: ZodType<TRecord>;
  loadByIdFn?: (id: string, includeDeleted?: boolean) => Promise<unknown | null>;
  createFn?: (data: TRecord) => Promise<unknown>;
  updateFn?: (id: string, data: TRecord) => Promise<unknown | null>;
  deleteFn?: (id: string, userId: string, reason?: string) => Promise<unknown | null>;
  restoreFn?: (id: string) => Promise<unknown | null>;
  namePlural: string;
  customPostRoute?: boolean;
  customPutRoute?: boolean;
  validateDynamicFn?: (tenant: string, data: TRecord, lang: string, user: User) => Promise<void>;
}

/**
 * Registers all standard tenant routes (Standard Extended + CRUD).
 */
export function registerStandardTenantRoutes<
  TQuery extends { page?: number; limit?: number; includeDeleted?: string } = Record<string, unknown>,
  TRecord extends ResourceRecord = ResourceRecord,
>(
  fastify: FastifyInstance,
  options: StandardTenantRoutesOptions<TQuery, TRecord>,
): void {
  const {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    namePlural,
    loadPageFn,
    loadAllFn,
    loadCountFn,
    computeMetricsFn,
    loadMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
    schema,
    loadByIdFn,
    createFn,
    updateFn,
    deleteFn,
    restoreFn,
    customPostRoute,
    customPutRoute,
    validateDynamicFn,
    canWriteDeletedCheck,
  } = options;

  registerStandardExtendedRoutes(fastify, {
    prefix,
    collection,
    listQuerySchema,
    defaultPageSize,
    errorMessagePrefix,
    nameSingular,
    loadPageFn,
    loadAllFn,
    loadCountFn,
    computeMetricsFn,
    loadMetricsFn,
    loadWidgetAggregatesFn,
    loadByIdsFn,
    columnPreferencesObjectKey,
    loadLinkedContactIdsFn,
    canWriteDeletedCheck,
  });

  const hasPaginatedListRoute = !!(listQuerySchema && loadPageFn);

  registerResourceRoutes(fastify, {
    prefix,
    customGetRoute: hasPaginatedListRoute,
    customPostRoute,
    customPutRoute,
    collection,
    schema,
    loadAllFn,
    loadByIdFn,
    createFn,
    updateFn,
    deleteFn,
    restoreFn,
    nameSingular,
    namePlural,
    validateDynamicFn,
  });
}
