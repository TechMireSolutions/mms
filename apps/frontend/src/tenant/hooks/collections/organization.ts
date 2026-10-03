/**
 * Cross-module public surface for Organization Query hooks.
 * Other features and shared UI must import from here — not `@/tenant/features/organization/hooks/*`.
 */
export {
  ORGANIZATION_QUERY_KEY,
  ORGANIZATION_LOCATIONS_QUERY_KEY,
  ORGANIZATION_POSITIONS_QUERY_KEY,
  ORGANIZATION_TREE_QUERY_KEY,
  ORGANIZATION_BLUEPRINTS_QUERY_KEY,
} from '@/tenant/features/organization/hooks/organizationQueryKeys';

export {
  useOrganizationLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useOrganizationPositions,
  useOrganizationTree,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  useOrganizationBlueprints,
  useApplyBlueprint,
  invalidateOrganizationQueries,
} from '@/tenant/features/organization/hooks/useOrganizationApi';
