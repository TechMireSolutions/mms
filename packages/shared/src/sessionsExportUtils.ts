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

export const DEFAULT_SESSION_EXPORT_COLUMNS: readonly SessionExportColumn[] = [
  { id: 'name', label: 'Session Name' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'startDate', label: 'Start Date' },
  { id: 'endDate', label: 'End Date' },
  { id: 'baseFee', label: 'Base Fee' },
  { id: 'currency', label: 'Currency' },
] as const;

/** Filters export columns by Sessions Setup field toggles. */
export function filterSessionExportColumnsForViewer(
  columns: SessionExportColumn[],
  settings: SessionsSettings | null | undefined,
): SessionExportColumn[] {
  const source = columns.length > 0 ? columns : [...DEFAULT_SESSION_EXPORT_COLUMNS];
  const fields = settings?.fields;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return source;
  return source.filter((column) => {
    if (SESSION_EXPORT_ALWAYS_VISIBLE.has(column.id)) return true;
    const fieldDef = fields[column.id] as { enabled?: boolean } | undefined;
    if (fieldDef && fieldDef.enabled === false) return false;
    return true;
  });
}

function compileSessionColumnExtractor(columnId: string): (session: Session) => string {
  if (columnId === 'name') return (s) => s.name || '';
  if (columnId === 'type') return (s) => s.type || '';
  if (columnId === 'status') return (s) => s.status || '';
  if (columnId === 'startDate') return (s) => s.startDate || '';
  if (columnId === 'endDate') return (s) => s.endDate || '';
  if (columnId === 'baseFee') return (s) => String(s.baseFee ?? '');
  if (columnId === 'currency') return (s) => s.currency || '';
  if (columnId === 'description') return (s) => s.description || '';
  if (columnId === 'duration') {
    return (s) => {
      const start = s.startDate || '';
      const end = s.endDate || '';
      return start && end ? `${start} → ${end}` : start || end;
    };
  }
  if (columnId === 'enrolled') {
    return (s) => {
      const classes = s.classes ?? [];
      return String(classes.reduce((sum, cls) => sum + (cls.enrolled ?? 0), 0));
    };
  }
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  return (session) => {
    const value = session[propKey as keyof Session];
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.map(String).filter(Boolean).join('; ');
    if (typeof value === 'object') return '';
    return String(value);
  };
}

/** Builds CSV rows (header + data) for the given sessions and visible columns. */
export function buildSessionsExportRows(
  sessions: Session[],
  columns: SessionExportColumn[],
): unknown[][] {
  const header = columns.map((column) => column.label);
  const extractors = columns.map((column) => compileSessionColumnExtractor(column.id));
  const rows = sessions.map((session) =>
    extractors.map((extract) => extract(session)),
  );
  return [header, ...rows];
}
