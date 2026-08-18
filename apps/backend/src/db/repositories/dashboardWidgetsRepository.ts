import { and, asc, eq, sql } from 'drizzle-orm';
import type { DashboardWidgetDto } from '@mms/shared';
import { dashboardWidgets } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

type DashboardWidgetRow = typeof dashboardWidgets.$inferSelect;

/** Fields projected onto typed `dashboard_widgets` columns (the rest go in jsonb `config`). */
const COLUMN_FIELDS = [
  'id',
  'widgetType',
  'category',
  'collection',
  'role',
  'isPinnedToDashboard',
  'title',
  'icon',
  'color',
  'operation',
  'sortOrder',
] as const;

/** Split a widget DTO into typed columns + the jsonb `config` remainder. */
function toRow(
  workspaceSubdomain: string,
  widget: DashboardWidgetDto,
  fallbackSortOrder: number,
): {
  id: string;
  workspaceSubdomain: string;
  widgetType: string | null;
  category: string;
  collection: string;
  role: string | null;
  isPinnedToDashboard: boolean;
  title: string;
  icon: string | null;
  color: string;
  operation: string;
  sortOrder: number;
  config: Record<string, unknown> | null;
  updatedAt: Date;
} {
  const config: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(widget)) {
    if (!COLUMN_FIELDS.includes(key as (typeof COLUMN_FIELDS)[number])) {
      config[key] = value;
    }
  }
  return {
    id: widget.id,
    workspaceSubdomain,
    widgetType: widget.widgetType ?? null,
    category: widget.category,
    collection: widget.collection,
    role: widget.role ?? null,
    isPinnedToDashboard: widget.isPinnedToDashboard,
    title: widget.title,
    icon: widget.icon ?? null,
    color: widget.color,
    operation: widget.operation,
    sortOrder: widget.sortOrder ?? fallbackSortOrder,
    config: Object.keys(config).length > 0 ? config : null,
    updatedAt: new Date(),
  };
}

/** Merge a stored row back into a widget DTO (typed columns win, then jsonb `config`). */
function toDto(row: DashboardWidgetRow): DashboardWidgetDto {
  const config = (row.config ?? {}) as Record<string, unknown>;
  return {
    ...config,
    id: row.id,
    widgetType: (row.widgetType ?? undefined) as DashboardWidgetDto['widgetType'],
    category: row.category,
    collection: row.collection,
    role: (row.role ?? undefined) as DashboardWidgetDto['role'],
    isPinnedToDashboard: row.isPinnedToDashboard,
    title: row.title,
    icon: (row.icon ?? undefined) as DashboardWidgetDto['icon'],
    color: row.color,
    operation: row.operation as DashboardWidgetDto['operation'],
    sortOrder: row.sortOrder,
  } as DashboardWidgetDto;
}

/** List all dashboard widgets for a workspace, ordered by pin order. */
export async function listDashboardWidgetsByWorkspace(
  workspaceSubdomain: string,
): Promise<DashboardWidgetDto[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.workspaceSubdomain, subdomain))
      .orderBy(asc(dashboardWidgets.sortOrder), asc(dashboardWidgets.id));
    return rows.map(toDto);
  });
}

/** Bulk upsert widgets by (workspace, id) — insert new, update existing, leave untouched rows alone. */
export async function upsertDashboardWidgetsForWorkspace(
  workspaceSubdomain: string,
  widgets: DashboardWidgetDto[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (widgets.length === 0) return;
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .insert(dashboardWidgets)
      .values(widgets.map((widget, index) => toRow(subdomain, widget, index)))
      .onConflictDoUpdate({
        target: [dashboardWidgets.workspaceSubdomain, dashboardWidgets.id],
        set: {
          widgetType: sql`excluded.widget_type`,
          category: sql`excluded.category`,
          collection: sql`excluded.collection`,
          role: sql`excluded.role`,
          isPinnedToDashboard: sql`excluded.is_pinned_to_dashboard`,
          title: sql`excluded.title`,
          icon: sql`excluded.icon`,
          color: sql`excluded.color`,
          operation: sql`excluded.operation`,
          sortOrder: sql`excluded.sort_order`,
          config: sql`excluded.config`,
          updatedAt: new Date(),
        },
      });
  });
}

/** Delete a single dashboard widget by id within the workspace. */
export async function deleteDashboardWidgetById(
  workspaceSubdomain: string,
  id: string,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(dashboardWidgets)
      .where(
        and(
          eq(dashboardWidgets.workspaceSubdomain, subdomain),
          eq(dashboardWidgets.id, id),
        ),
      );
  });
}

/** Backup/restore parity — full workspace widget rows. */
export async function listAllDashboardWidgetsByWorkspace(
  workspaceSubdomain: string,
): Promise<DashboardWidgetRow[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    return tx
      .select()
      .from(dashboardWidgets)
      .where(eq(dashboardWidgets.workspaceSubdomain, subdomain));
  });
}

/** Backup/restore parity — replace the full widget set for a workspace. */
export async function replaceDashboardWidgetsForWorkspace(
  workspaceSubdomain: string,
  records: Array<Record<string, unknown>>,
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenantTransaction(subdomain, async (tx) => {
    await tx
      .delete(dashboardWidgets)
      .where(eq(dashboardWidgets.workspaceSubdomain, subdomain));
    if (records.length === 0) return;
    const widgets = records.map((record, index) => {
      const dto = {
        id: String(record.id ?? `restore-${index}`),
        title: String(record.title ?? ''),
        category: String(record.category ?? ''),
        collection: String(record.collection ?? ''),
        operation: String(record.operation ?? 'count'),
        color: String(record.color ?? ''),
        isPinnedToDashboard: Boolean(record.isPinnedToDashboard),
        ...record,
      } as DashboardWidgetDto;
      return toRow(subdomain, dto, index);
    });
    await tx.insert(dashboardWidgets).values(widgets);
  });
}