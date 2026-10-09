/**
 * @file sessionsExportUtils.ts
 * @description Sessions module export utilities.
 *
 * MIGRATION (T10): `buildSessionsExportRows` now delegates to `buildExportGrid`.
 * `filterSessionExportColumnsForViewer` uses a flat enabled-field map (no tab
 * registry), so it is kept as a simple predicate filter.
 */
import type { Session } from './sessionTypes.js';
import type { SessionsSettings } from './sessionsModuleSettings.js';
import { buildExportGrid } from './dataTransfer/export/buildExportGrid.js';
import type { ExportColumn } from './dataTransfer/core/exportTypes.js';

// ---------------------------------------------------------------------------
// Column type
// ---------------------------------------------------------------------------

export interface SessionExportColumn {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_EXPORT_ALWAYS_VISIBLE = new Set([
  'name',
  'type',
  'status',
  'startDate',
  'endDate',
]);

export const DEFAULT_SESSION_EXPORT_COLUMNS: readonly SessionExportColumn[] = [
  { id: 'name', label: 'Session Name' },
  { id: 'type', label: 'Type' },
  { id: 'status', label: 'Status' },
  { id: 'startDate', label: 'Start Date' },
  { id: 'endDate', label: 'End Date' },
  { id: 'baseFee', label: 'Base Fee' },
  { id: 'currency', label: 'Currency' },
] as const;

// ---------------------------------------------------------------------------
// View layout normalizer (no change)
// ---------------------------------------------------------------------------

/** Maps retired Setup preference `list` → Work SSOT `table`. */
export function normalizeSessionsViewLayout(layout?: string): 'table' | 'cards' {
  if (layout === 'cards') return 'cards';
  if (layout === 'list' || layout === 'table') return 'table';
  return 'table';
}

// ---------------------------------------------------------------------------
// Column filter
// ---------------------------------------------------------------------------

/** Filters export columns by Sessions Setup field toggles (flat map, no tab registry). */
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

// ---------------------------------------------------------------------------
// Cell extractor
// ---------------------------------------------------------------------------

/** Pure cell extractor for Session entities. Compatible with ExportCellExtractor<Session>. */
export function extractSessionCell(session: Session, columnId: string): string | number | null {
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
  const propKey = columnId.startsWith('custom:') ? columnId.slice('custom:'.length) : columnId;
  const value = session[propKey as keyof Session];
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join('; ');
  if (typeof value === 'object') return '';
  return String(value);
}

// ---------------------------------------------------------------------------
// Grid builder — delegates to generic utility
// ---------------------------------------------------------------------------

/** Builds a 2D grid [header, ...rows] for the given sessions and columns. */
export function buildSessionsExportRows(
  sessions: Session[],
  columns: SessionExportColumn[],
): unknown[][] {
  return buildExportGrid(sessions, columns as ExportColumn[], extractSessionCell);
}
