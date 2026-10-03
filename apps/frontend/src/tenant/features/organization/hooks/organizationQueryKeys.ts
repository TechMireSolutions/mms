/**
 * Query key factories for Organization module.
 */
export const ORGANIZATION_QUERY_KEY = ['organization'] as const;

export const ORGANIZATION_LOCATIONS_QUERY_KEY = [
  ...ORGANIZATION_QUERY_KEY,
  'locations',
] as const;

export const ORGANIZATION_POSITIONS_QUERY_KEY = [
  ...ORGANIZATION_QUERY_KEY,
  'positions',
] as const;

export const ORGANIZATION_TREE_QUERY_KEY = [
  ...ORGANIZATION_QUERY_KEY,
  'tree',
] as const;

export const ORGANIZATION_BLUEPRINTS_QUERY_KEY = [
  ...ORGANIZATION_QUERY_KEY,
  'blueprints',
] as const;
