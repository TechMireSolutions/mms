import { getRequestTenant } from '../lib/tenantContext.js';
import {
  listCustomTabsByWorkspace,
  findCustomTabById,
  saveCustomTabRow,
  deleteCustomTabRow,
  replaceCustomTabsForModule,
  CustomTabDbInput
} from '../db/repositories/customTabsRepository.js';

export async function loadCustomTabs(moduleId?: string) {
  const tenant = getRequestTenant();
  if (!tenant) return [];
  return listCustomTabsByWorkspace(tenant, moduleId);
}

export async function loadCustomTabById(id: string) {
  const tenant = getRequestTenant();
  if (!tenant) return null;
  return findCustomTabById(tenant, id);
}

export async function createCustomTab(record: Omit<CustomTabDbInput, 'id' | 'workspaceSubdomain'>) {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const id = `${tenant}:${record.moduleId}:${record.key}`;
  const values = {
    ...record,
    id,
    workspaceSubdomain: tenant,
  };
  await saveCustomTabRow(tenant, values);
  return values;
}

export async function updateCustomTab(id: string, record: Partial<Omit<CustomTabDbInput, 'id' | 'workspaceSubdomain'>>) {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  const existing = await findCustomTabById(tenant, id);
  if (!existing) throw new Error('Custom tab not found');
  const updated = {
    ...existing,
    ...record,
    id,
    workspaceSubdomain: tenant,
  } as CustomTabDbInput;
  await saveCustomTabRow(tenant, updated);
  return updated;
}

export async function deleteCustomTab(id: string) {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  await deleteCustomTabRow(tenant, id);
}

export async function replaceCustomTabs(moduleId: string, tabs: Omit<CustomTabDbInput, 'id' | 'workspaceSubdomain' | 'moduleId'>[]) {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  await replaceCustomTabsForModule(tenant, moduleId, tabs);
  return listCustomTabsByWorkspace(tenant, moduleId);
}
