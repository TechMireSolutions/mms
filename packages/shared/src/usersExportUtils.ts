import type { WorkspaceUser } from './userEntityTypes.js';

export interface UserExportColumn {
  id: string;
  label: string;
}

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

/** Users Work CSV uses simple always-visible core columns. */
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

function compileUserColumnExtractor(columnId: string): (user: WorkspaceUser) => string {
  if (columnId === 'name') return (u) => u.name || '';
  if (columnId === 'email') return (u) => u.email || u.loginEmail || '';
  if (columnId === 'role') return (u) => u.role || '';
  if (columnId === 'status') return (u) => String(u.status || 'active');
  if (columnId === 'phone') return (u) => u.phone || '';
  if (columnId === 'lastLogin') return (u) => u.lastLogin || '';
  if (columnId === 'createdDate') return (u) => u.createdDate || '';
  if (columnId === 'twoFactorEnabled') return (u) => (u.twoFactorEnabled ? 'yes' : 'no');
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  return (user) => {
    const cellVal = user[propKey as keyof WorkspaceUser];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  };
}

/** Builds CSV rows (header + data) for the given users and visible columns. */
export function buildUsersExportRows(
  users: WorkspaceUser[],
  columns: UserExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const extractors = columns.map((column) => compileUserColumnExtractor(column.id));
  const rows = users.map((user) =>
    extractors.map((extract) => extract(user)),
  );
  return [header, ...rows];
}
