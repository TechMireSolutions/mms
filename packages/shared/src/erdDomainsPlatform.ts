import type { ErdDomain } from './erdCatalogTypes.js';

/** Apex workspace registry and platform operators (Drizzle `platform.ts`). */
export const ERD_DOMAIN_PLATFORM: ErdDomain = {
  id: 'platform',
  labelKey: 'platform.erdDomainPlatform',
  tables: [
    {
      name: 'workspaces',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'subdomain', type: 'text', kind: 'unique' },
        { name: 'madrasa_name', type: 'text', kind: 'column' },
        { name: 'enabled', type: 'boolean', kind: 'column' },
      ],
    },
    {
      name: 'platform_users',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'email', type: 'text', kind: 'unique' },
        { name: 'role', type: 'text', kind: 'column' },
      ],
    },
    {
      name: 'platform_user_permissions',
      columns: [
        { name: 'id', type: 'bigint', kind: 'pk' },
        { name: 'platform_user_id', type: 'text', kind: 'fk' },
        { name: 'permission_key', type: 'varchar(40)', kind: 'unique' },
      ],
    },
    {
      name: 'platform_activity_logs',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'user_id', type: 'text', kind: 'fk' },
      ],
    },
    {
      name: 'platform_settings',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'sync_tls_on_create', type: 'boolean', kind: 'column' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'platform_user_permissions',
      fromColumn: 'platform_user_id',
      toTable: 'platform_users',
      toColumn: 'id',
      cardinality: 'N:1',
      onDelete: 'cascade',
    },
    {
      fromTable: 'platform_activity_logs',
      fromColumn: 'user_id',
      toTable: 'platform_users',
      toColumn: 'id',
      cardinality: 'N:1',
    },
  ],
};

/** Jobs, reports, and audit trail (Drizzle `system.ts`). */
export const ERD_DOMAIN_SYSTEM: ErdDomain = {
  id: 'system',
  labelKey: 'platform.erdDomainSystem',
  tables: [
    {
      name: 'background_jobs',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'tenant_id', type: 'text', kind: 'fk' },
        { name: 'user_id', type: 'text', kind: 'fk' },
      ],
    },
    {
      name: 'saved_reports',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'audit_log_entries',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'user_activity_logs',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'tenant_users',
      columns: [
        { name: 'workspace_subdomain', type: 'text', kind: 'pk' },
        { name: 'id', type: 'text', kind: 'pk' },
      ],
    },
    {
      name: 'workspaces',
      columns: [
        { name: 'id', type: 'text', kind: 'pk' },
        { name: 'subdomain', type: 'text', kind: 'unique' },
      ],
    },
  ],
  relationships: [
    {
      fromTable: 'background_jobs',
      fromColumn: 'user_id',
      toTable: 'tenant_users',
      toColumn: 'id',
      cardinality: 'N:1',
    },
    {
      fromTable: 'saved_reports',
      fromColumn: 'workspace_subdomain',
      toTable: 'workspaces',
      toColumn: 'subdomain',
      cardinality: 'N:1',
    },
    {
      fromTable: 'audit_log_entries',
      fromColumn: 'workspace_subdomain',
      toTable: 'workspaces',
      toColumn: 'subdomain',
      cardinality: 'N:1',
    },
    {
      fromTable: 'user_activity_logs',
      fromColumn: 'workspace_subdomain',
      toTable: 'workspaces',
      toColumn: 'subdomain',
      cardinality: 'N:1',
    },
  ],
};
