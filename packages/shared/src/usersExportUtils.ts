/**
 * @file usersExportUtils.ts
 * @description Users module export utilities.
 *
 * MIGRATION (T10): `buildUsersExportRows` now delegates to `buildExportGrid`.
 * `filterUserExportColumnsForViewer` uses a simple always-visible set
 * (no tab/field registry), retained as-is.
 */
import type { WorkspaceUser } from './userEntityTypes.js';
import { buildExportGrid } from './dataTransfer/export/buildExportGrid.js';
import type { ExportColumn } from './dataTransfer/core/exportTypes.js';

// ---------------------------------------------------------------------------
// Column type
// ---------------------------------------------------------------------------

export interface UserExportColumn {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const USER_EXPORT_ALWAYS_VISIBLE = new Set([
  'name',
  'email',
  'role',
  'status',
  'phone',
  'lastLogin',
  'createdDate',
  'twoFactorEnabled',
]);

export const DEFAULT_USER_EXPORT_COLUMNS: readonly UserExportColumn[] = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'role', label: 'Role' },
  { id: 'status', label: 'Status' },
  { id: 'phone', label: 'Phone' },
  { id: 'lastLogin', label: 'Last login' },
  { id: 'createdDate', label: 'Created' },
  { id: 'twoFactorEnabled', label: '2FA enabled' },
] as const;

// ---------------------------------------------------------------------------
// Column filter
// ---------------------------------------------------------------------------

/** Users Work CSV uses simple always-visible core columns (no tab/field registry). */
export function filterUserExportColumnsForViewer(
  columns: UserExportColumn[],
): UserExportColumn[] {
  if (columns.length === 0) {
    return [...DEFAULT_USER_EXPORT_COLUMNS];
  }
  return columns.filter(
    (column) => USER_EXPORT_ALWAYS_VISIBLE.has(column.id) || column.id.startsWith('custom:'),
  );
}

// ---------------------------------------------------------------------------
// Cell extractor
// ---------------------------------------------------------------------------

/** Pure cell extractor for WorkspaceUser entities. Compatible with ExportCellExtractor<WorkspaceUser>. */
export function extractUserCell(user: WorkspaceUser, columnId: string): string | boolean | null {
  if (columnId === 'name') return user.name || '';
  if (columnId === 'email') return user.email || user.loginEmail || '';
  if (columnId === 'role') return user.role || '';
  if (columnId === 'status') return String(user.status || 'active');
  if (columnId === 'phone') return user.phone || '';
  if (columnId === 'lastLogin') return user.lastLogin || '';
  if (columnId === 'createdDate') return user.createdDate || '';
  if (columnId === 'twoFactorEnabled') return user.twoFactorEnabled ? 'yes' : 'no';
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  const cellVal = user[propKey as keyof WorkspaceUser];
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

// ---------------------------------------------------------------------------
// Grid builder — delegates to generic utility
// ---------------------------------------------------------------------------

/** Builds a 2D grid [header, ...rows] for the given users and columns. */
export function buildUsersExportRows(
  users: WorkspaceUser[],
  columns: UserExportColumn[],
): unknown[][] {
  return buildExportGrid(users, columns as ExportColumn[], extractUserCell);
}
