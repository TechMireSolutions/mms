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

/** Users Work CSV uses simple always-visible core columns. */
export function filterUserExportColumnsForViewer(
  columns: UserExportColumn[],
): UserExportColumn[] {
  if (columns.length === 0) {
    return [
      { id: 'name', label: 'Name' },
      { id: 'email', label: 'Email' },
      { id: 'role', label: 'Role' },
      { id: 'status', label: 'Status' },
      { id: 'phone', label: 'Phone' },
      { id: 'lastLogin', label: 'Last login' },
      { id: 'createdDate', label: 'Created' },
      { id: 'twoFactorEnabled', label: '2FA enabled' },
    ];
  }
  return columns.filter(
    (column) => USER_EXPORT_ALWAYS_VISIBLE.has(column.id) || column.id.startsWith('custom:'),
  );
}

function cellValue(user: WorkspaceUser, columnId: string): string {
  if (columnId === 'name') return user.name || '';
  if (columnId === 'email') return user.email || user.loginEmail || '';
  if (columnId === 'role') return user.role || '';
  if (columnId === 'status') return String(user.status || 'active');
  if (columnId === 'phone') return user.phone || '';
  if (columnId === 'lastLogin') return user.lastLogin || '';
  if (columnId === 'createdDate') return user.createdDate || '';
  if (columnId === 'twoFactorEnabled') return user.twoFactorEnabled ? 'yes' : 'no';
  if (columnId.startsWith('custom:')) {
    const customKey = columnId.slice('custom:'.length);
    const cellVal = user[customKey as keyof WorkspaceUser];
    if (cellVal === undefined || cellVal === null) return '';
    if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
    if (typeof cellVal === 'object') return '';
    return String(cellVal);
  }
  const cellVal = user[columnId as keyof WorkspaceUser];
  if (cellVal === undefined || cellVal === null) return '';
  if (Array.isArray(cellVal)) return cellVal.map(String).filter(Boolean).join('; ');
  if (typeof cellVal === 'object') return '';
  return String(cellVal);
}

/** Builds CSV rows (header + data) for the given users and visible columns. */
export function buildUsersExportRows(
  users: WorkspaceUser[],
  columns: UserExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = users.map((user) =>
    columns.map(({ id }) => cellValue(user, id)),
  );
  return [header, ...rows];
}
