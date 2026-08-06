import {
  STUDENT_LOOKUP_KINDS,
  defaultStudentLookupItems,
  emptyStudentLookupsMap,
  type StudentLookupKind,
  type StudentLookupsMap,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listStudentLookupsByKind,
  listStudentLookupsByWorkspace,
  replaceStudentLookupsForKind,
} from '../db/repositories/studentLookupsRepository.js';
import { broadcastTenantUpdate } from './websocketService.js';

function slugifyLabel(label: string, index: number): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `${base || 'item'}-${index}`;
}

function rowsToStringItems(rows: Array<{ label: string }>): string[] {
  return rows.map((row) => row.label).filter(Boolean);
}

export async function loadStudentLookupsMap(
  tenant = getRequestTenant(),
): Promise<StudentLookupsMap> {
  const empty = emptyStudentLookupsMap();
  if (!tenant) return empty;

  const rows = await listStudentLookupsByWorkspace(tenant);
  const byKind = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }

  const result = { ...empty };
  for (const kind of STUDENT_LOOKUP_KINDS) {
    const kindRows = byKind.get(kind) ?? [];
    if (kindRows.length === 0) continue;
    result[kind] = rowsToStringItems(kindRows);
  }
  return result;
}

export async function loadStudentLookupKind(
  kind: StudentLookupKind,
  tenant = getRequestTenant(),
): Promise<string[]> {
  if (!tenant) return defaultStudentLookupItems(kind);
  const rows = await listStudentLookupsByKind(tenant, kind);
  if (rows.length === 0) return defaultStudentLookupItems(kind);
  return rowsToStringItems(rows);
}

export async function replaceStudentLookupKind(
  kind: StudentLookupKind,
  items: string[],
  tenant = getRequestTenant(),
): Promise<string[]> {
  if (!tenant) throw new Error('Tenant context required');

  const labels = items.map((label) => label.trim()).filter(Boolean);
  await replaceStudentLookupsForKind(
    tenant,
    kind,
    labels.map((label, index) => ({
      id: `${tenant}:${kind}:${slugifyLabel(label, index)}`,
      kind,
      label,
      meta: null,
      sortOrder: index,
    })),
  );
  broadcastTenantUpdate(tenant, 'collection', 'students');
  return labels;
}
