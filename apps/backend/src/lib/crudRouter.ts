/** Shared Fastify CRUD / bulk / metrics route registrars for tenant modules. */
export type { ResourceRecord } from './crudRouterTypes.js';
export {
  registerBulkRoutes,
  registerIncludableBulkRoutes,
  registerSoftDeletableBulkRoutes,
  type BulkRoutesOptions,
  type SoftDeleteRouteErrorMapper,
  type SoftDeletableBulkRoutesOptions,
} from './crudBulkRoutes.js';
export {
  registerResourceRoutes,
  type ResourceRoutesOptions,
} from './crudResourceRoutes.js';
export {
  registerMetricsRoute,
  registerCountRoute,
  registerResolveRoute,
  registerWidgetAggregatesRoute,
  registerLinkedContactIdsRoute,
  registerBulkPutRoute,
  type MetricsRouteOptions,
  type CountRouteOptions,
  type ResolveRouteOptions,
  type WidgetAggregatesRouteOptions,
  type LinkedContactIdsRouteOptions,
  type BulkPutRouteOptions,
} from './crudQueryRoutes.js';
export {
  registerPaginatedListRoute,
  type PaginatedListRouteOptions,
} from './crudPaginatedRoutes.js';
export {
  registerStandardExtendedRoutes,
  registerStandardTenantRoutes,
  type StandardExtendedRoutesOptions,
  type StandardTenantRoutesOptions,
} from './crudStandardRoutes.js';
