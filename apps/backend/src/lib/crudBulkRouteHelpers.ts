import type { ZodType } from 'zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { isQueryFlagTrue, type User } from '@mms/shared';
import { canDeleteCollection, canReadCollection } from './rbacCanHelpers.js';
import { sendForbidden, sendDatabaseError } from './httpErrors.js';
import { parseRequest, replyValidationError } from './zodRequest.js';
import { includeDeletedQuerySchema } from '../validation/commonSchemas.js';

export interface BulkRoutesOptions<T> {
  path: string;
  collection: string;
  schema: ZodType<T>;
  loadFn?: () => Promise<unknown>;
  loadPageFn?: (query: any) => Promise<unknown>;
  /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
  listQuerySchema?: ZodType;
  /** Fallback page size when the client omits `limit` (schema path). */
  defaultPageSize?: number;
  saveFn: (data: T) => Promise<unknown>;
  responseKey: string;
  errorMessagePrefix: string;
  /** When true, omits registering the GET endpoint (e.g. handled by @ts-rest contract router). */
  customGetRoute?: boolean;
}

export type SoftDeleteRouteErrorMapper = (
  error: unknown,
) => { statusCode: number; body: Record<string, unknown> } | null;

export interface SoftDeletableBulkRoutesOptions<T> {
  path: string;
  collection: string;
  schema: ZodType<T>;
  loadFn: (options?: { includeDeleted?: boolean }) => Promise<unknown>;
  loadPageFn?: (query: any) => Promise<unknown>;
  /** When provided, the GET branch validates the full query (page/limit/search/sort/filters) and forwards it to `loadPageFn`. */
  listQuerySchema?: ZodType;
  /** Fallback page size when the client omits `limit` (schema path). */
  defaultPageSize?: number;
  saveFn: (data: T) => Promise<unknown>;
  deleteFn: (id: string, userId: string, reason?: string) => Promise<boolean | null | unknown>;
  restoreFn: (id: string) => Promise<boolean | null | unknown>;
  bulkDeleteFn: (
    ids: string[],
    userId: string,
    reason?: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  bulkRestoreFn: (ids: string[]) => Promise<{ succeeded: number; failed: number }>;
  responseKey: string;
  errorMessagePrefix: string;
  nameSingular: string;
  /** Defaults to {@link bulkIdsBodySchema}; use string-only schemas when needed. */
  bulkBodySchema?: ZodType<{ ids: Array<string | number>; deletionReason?: string }>;
  /** Map domain delete failures (e.g. posted entries, self-delete) to stable HTTP responses. */
  mapDeleteError?: SoftDeleteRouteErrorMapper;
}

export type SoftDeletableBulkTrashRoutesOptions = {
  /** Route prefix; use `/` for module root (contacts/students plugins). */
  path?: string;
  collection: string;
  errorMessagePrefix: string;
  bulkBodySchema?: ZodType<{ ids: Array<string | number>; deletionReason?: string }>;
  bulkDeleteFn: (
    ids: string[],
    userId: string,
    reason?: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  /** Second `userId` arg for modules that audit restore actor (Contacts). */
  bulkRestoreFn: (
    ids: string[],
    userId: string,
  ) => Promise<{ succeeded: number; failed: number }>;
  canDelete?: (user: User) => boolean;
  onAfterBulkDelete?: (
    user: User,
    result: { succeeded: number; failed: number },
    deletionReason?: string,
  ) => Promise<void>;
  onAfterBulkRestore?: (
    user: User,
    result: { succeeded: number; failed: number },
  ) => Promise<void>;
};

export type BulkListLoadContext = {
  loadFn?: () => Promise<unknown>;
  loadPageFn?: (query: any) => Promise<unknown>;
  listQuerySchema?: ZodType;
  defaultPageSize?: number;
  responseKey: string;
  errorMessagePrefix: string;
  /** When true, parse `includeDeleted` and gate trash reads on delete permission. */
  supportsIncludeDeleted?: boolean;
};

export async function handleBulkListGet(
  request: FastifyRequest,
  reply: FastifyReply,
  user: User,
  collection: string,
  ctx: BulkListLoadContext,
): Promise<unknown> {
  if (!canReadCollection(user, collection)) return sendForbidden(reply);

  const {
    loadFn,
    loadPageFn,
    listQuerySchema,
    defaultPageSize,
    responseKey,
    errorMessagePrefix,
    supportsIncludeDeleted,
  } = ctx;

  try {
    let pageQuery: Record<string, unknown> | undefined;
    let includeDeleted: boolean | undefined;

    if (listQuerySchema) {
      const parsed = parseRequest(listQuerySchema, request.query);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      const query = parsed.data as Record<string, unknown>;
      if (supportsIncludeDeleted) {
        includeDeleted = isQueryFlagTrue(query.includeDeleted);
      }
      if (query.page != null && loadPageFn) pageQuery = query;
    } else if (supportsIncludeDeleted) {
      const parsed = parseRequest(includeDeletedQuerySchema, request.query);
      if (!parsed.ok) return replyValidationError(reply, parsed.message);
      includeDeleted = isQueryFlagTrue(parsed.data.includeDeleted);
    }

    if (includeDeleted && !canDeleteCollection(user, collection)) {
      return sendForbidden(reply);
    }

    if (pageQuery && loadPageFn) {
      const data = await loadPageFn({
        ...pageQuery,
        limit: pageQuery.limit ?? defaultPageSize,
        ...(supportsIncludeDeleted ? { includeDeleted } : {}),
      });
      return reply.send(data);
    }

    if (!listQuerySchema) {
      const queryParams = request.query as Record<string, string>;
      const isPaginated = !!(queryParams.page || queryParams.limit || queryParams.sortField);
      if (isPaginated && loadPageFn) {
        const page = parseInt(queryParams.page || '1', 10);
        const limit = parseInt(queryParams.limit || '50', 10);
        const data = await loadPageFn({
          page,
          limit,
          search: queryParams.search,
          sortField: queryParams.sortField,
          sortDir: queryParams.sortDir as 'asc' | 'desc',
          ...(supportsIncludeDeleted ? { includeDeleted } : {}),
        });
        return reply.send(data);
      }
    }

    if (!loadFn) {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix}`);
    }

    const data = supportsIncludeDeleted
      ? await (loadFn as (options?: { includeDeleted?: boolean }) => Promise<unknown>)({
          includeDeleted,
        })
      : await loadFn();
    return reply.send({ [responseKey]: data });
  } catch (error: unknown) {
    if (supportsIncludeDeleted) {
      return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix}`, error);
    }
    return sendDatabaseError(reply, `Failed to load ${errorMessagePrefix}`);
  }
}
