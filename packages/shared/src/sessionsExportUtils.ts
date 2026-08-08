import type { Session } from './sessionTypes.js';
import type { SessionsSettings } from './sessionsModuleSettings.js';

export interface SessionExportColumn {
  id: string;
  label: string;
}

const SESSION_EXPORT_ALWAYS_VISIBLE = new Set([
  'name',
  'type',
  'status',
  'startDate',
  'endDate',
]);

/** Maps retired Setup preference `list` → Work SSOT `table`. */
export function normalizeSessionsViewLayout(layout?: string): 'table' | 'cards' {
  if (layout === 'cards') return 'cards';
  if (layout === 'list' || layout === 'table') return 'table';
  return 'table';
}

/** Filters export columns by Sessions Setup field toggles. */
export function filterSessionExportColumnsForViewer(
  columns: SessionExportColumn[],
  settings: SessionsSettings | null | undefined,
): SessionExportColumn[] {
  const fields = settings?.fields;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return columns;
  return columns.filter((column) => {
    if (SESSION_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;
    const fieldDef = fields[column.id] as { enabled?: boolean } | undefined;
    if (fieldDef && fieldDef.enabled === false) return false;
    return true;
  });
}

function cellValue(session: Session, columnId: string): string {
  if (columnId === 'name') return session.name || '';
  if (columnId === 'type') return session.type || '';
  if (columnId === 'status') return session.status || '';
  if (columnId === 'startDate') return session.startDate || '';
  if (columnId === 'endDate') return session.endDate || '';
  if (columnId === 'baseFee') return String(session.baseFee ?? '');
  if (columnId === 'currency') return session.currency || '';
  if (columnId === 'description') return session.description || '';
  if (columnId === 'duration') {
    const start = session.startDate || '';
    const end = session.endDate || '';
    return start && end ? `${start} → ${end}` : start || end;
  }
  if (columnId === 'enrolled') {
    const classes = session.classes ?? [];
    return String(classes.reduce((sum, cls) => sum + (cls.enrolled ?? 0), 0));
  }
  const value = session[columnId as keyof Session];
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join('; ');
  if (typeof value === 'object') return '';
  return String(value);
}

/** Builds CSV rows (header + data) for the given sessions and visible columns. */
export function buildSessionsExportRows(
  sessions: Session[],
  columns: SessionExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const rows = sessions.map((session) =>
    columns.map(({ id }) => cellValue(session, id)),
  );
  return [header, ...rows];
}
