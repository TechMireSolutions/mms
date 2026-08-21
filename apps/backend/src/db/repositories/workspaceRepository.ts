import { eq } from 'drizzle-orm';
import {
  type Workspace,
  type BrandingSettings,
  type GlobalSettings,
  mergeGlobalSettings,
  SYSTEM_MODULES,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import { workspaces as workspacesTable } from '../schema.js';

function rowToWorkspace(ws: typeof workspacesTable.$inferSelect): Workspace {
  return {
    id: ws.id,
    subdomain: ws.subdomain,
    madrasaName: ws.madrasaName,
    tagline: ws.tagline ?? undefined,
    country: ws.country ?? undefined,
    enabled: ws.enabled,
    createdAt: ws.createdAt.toISOString(),
  };
}

/** Map nullable workspace columns back to a BrandingSettings shape. */
function rowToBranding(ws: typeof workspacesTable.$inferSelect): BrandingSettings {
  return {
    madrasaName:        ws.madrasaName,
    tagline:            ws.tagline            ?? '',
    primaryColor:       ws.primaryColor       ?? '',
    secondaryColor:     ws.secondaryColor     ?? '',
    cornerStyle:        (ws.cornerStyle as BrandingSettings['cornerStyle']) ?? 'rounded',
    logoUrl:            ws.logoUrl            ?? '',
    faviconUrl:         ws.faviconUrl         ?? '',
    footerText:         ws.footerText         ?? '',
    email:              ws.email              ?? '',
    phone:              ws.phone              ?? '',
    website:            ws.website            ?? '',
    legalName:          ws.legalName          ?? '',
    registrationNumber: ws.registrationNumber ?? '',
    addressLine1:       ws.addressLine1       ?? '',
    addressLine2:       ws.addressLine2       ?? '',
    city:               ws.city               ?? '',
    region:             ws.region             ?? '',
    postalCode:         ws.postalCode         ?? '',
    country:            ws.country            ?? '',
    socialLinks:        (ws.socialLinks as BrandingSettings['socialLinks']) ?? [],
  };
}

/** Map nullable workspace columns back to a GlobalSettings shape (with defaults). */
function rowToGlobalSettings(ws: typeof workspacesTable.$inferSelect): GlobalSettings {
  return mergeGlobalSettings({
    language:           ws.language as GlobalSettings['language'] ?? undefined,
    timezone:           ws.timezone ?? undefined,
    dateFormat:         ws.dateFormat ?? undefined,
    emailNotifications: ws.emailNotifications ?? undefined,
    smsNotifications:   ws.smsNotifications ?? undefined,
    twoFactor:          ws.twoFactor ?? undefined,
    sessionTimeout:     ws.sessionTimeout ?? undefined,
    passwordPolicy:     ws.passwordPolicy ?? undefined,
    theme:              ws.theme as GlobalSettings['theme'] ?? undefined,
    enabledModules:     (ws.enabledModules as Record<string, boolean>) ?? undefined,
    llmProvider:        ws.llmProvider as GlobalSettings['llmProvider'] ?? undefined,
    llmApiKey:          ws.llmApiKey ?? undefined,
    llmConfigs:         (ws.llmConfigs as GlobalSettings['llmConfigs']) ?? undefined,
  });
}

export async function listWorkspaceRows(): Promise<Workspace[]> {
  const rows = await getDb().select().from(workspacesTable);
  return rows.map(rowToWorkspace);
}

export async function findWorkspaceRowBySubdomain(subdomain: string): Promise<Workspace | null> {
  const rows = await getDb()
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.subdomain, subdomain));
  const ws = rows[0];
  return ws ? rowToWorkspace(ws) : null;
}

/** Read all branding fields for a workspace. Returns null when workspace not found. */
export async function getWorkspaceBranding(subdomain: string): Promise<BrandingSettings | null> {
  const rows = await getDb()
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.subdomain, subdomain));
  const ws = rows[0];
  return ws ? rowToBranding(ws) : null;
}

/** Read all global settings for a workspace. Returns null when workspace not found. */
export async function getWorkspaceGlobalSettings(subdomain: string): Promise<GlobalSettings | null> {
  const rows = await getDb()
    .select()
    .from(workspacesTable)
    .where(eq(workspacesTable.subdomain, subdomain));
  const ws = rows[0];
  return ws ? rowToGlobalSettings(ws) : null;
}

export async function insertWorkspaceRow(values: {
  id: string;
  subdomain: string;
  madrasaName: string;
  tagline?: string | null;
  country?: string | null;
  enabled?: boolean;
}): Promise<void> {
  await getDb().insert(workspacesTable).values({
    id: values.id,
    subdomain: values.subdomain,
    madrasaName: values.madrasaName,
    tagline: values.tagline || null,
    country: values.country || null,
    enabled: values.enabled ?? true,
  });
}

export async function updateWorkspaceEnabledRow(subdomain: string, enabled: boolean): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({ enabled })
    .where(eq(workspacesTable.subdomain, subdomain));
}

/** Sync name/tagline columns — used for registry display; branding save uses upsertWorkspaceBranding. */
export async function updateWorkspaceBrandingRow(
  subdomain: string,
  branding: { madrasaName: string; tagline?: string | null },
): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({
      madrasaName: branding.madrasaName.trim(),
      tagline: branding.tagline?.trim() || null,
    })
    .where(eq(workspacesTable.subdomain, subdomain));
}

/** Write the full BrandingSettings into the workspaces typed columns. */
export async function upsertWorkspaceBranding(
  subdomain: string,
  b: BrandingSettings,
): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({
      madrasaName:        b.madrasaName.trim(),
      tagline:            b.tagline?.trim()            || null,
      primaryColor:       b.primaryColor               || null,
      secondaryColor:     b.secondaryColor             || null,
      cornerStyle:        b.cornerStyle                || null,
      logoUrl:            b.logoUrl                    || null,
      faviconUrl:         b.faviconUrl                 || null,
      footerText:         b.footerText                 || null,
      email:              b.email                      || null,
      phone:              b.phone                      || null,
      website:            b.website                    || null,
      legalName:          b.legalName                  || null,
      registrationNumber: b.registrationNumber         || null,
      addressLine1:       b.addressLine1               || null,
      addressLine2:       b.addressLine2               || null,
      city:               b.city                       || null,
      region:             b.region                     || null,
      postalCode:         b.postalCode                 || null,
      socialLinks:        b.socialLinks?.length ? b.socialLinks : null,
    })
    .where(eq(workspacesTable.subdomain, subdomain));
}

/** Write the full GlobalSettings into the workspaces typed columns. */
export async function upsertWorkspaceGlobalSettings(
  subdomain: string,
  g: GlobalSettings,
): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({
      language:           g.language           || null,
      timezone:           g.timezone           || null,
      dateFormat:         g.dateFormat         || null,
      emailNotifications: g.emailNotifications,
      smsNotifications:   g.smsNotifications,
      twoFactor:          g.twoFactor,
      sessionTimeout:     g.sessionTimeout     || null,
      passwordPolicy:     g.passwordPolicy     || null,
      theme:              g.theme              || null,
      enabledModules:     g.enabledModules,
      llmProvider:        g.llmProvider        || null,
      llmApiKey:          g.llmApiKey          || null,
      llmConfigs:         g.llmConfigs?.length ? g.llmConfigs : null,
    })
    .where(eq(workspacesTable.subdomain, subdomain));
}

/** Returns granted module IDs for the specified workspace. */
export async function getWorkspaceGrantedModulesRepo(subdomain: string): Promise<string[]> {
  const rows = await getDb()
    .select({
      grantedModules: workspacesTable.grantedModules,
    })
    .from(workspacesTable)
    .where(eq(workspacesTable.subdomain, subdomain));
  const ws = rows[0];
  const granted = (ws?.grantedModules as Record<string, boolean> | undefined) || {};
  if (!ws?.grantedModules || Object.keys(granted).length === 0) {
    return SYSTEM_MODULES.map((m) => m.id);
  }
  return Object.entries(granted)
    .filter(([_, isGranted]) => Boolean(isGranted))
    .map(([id]) => id);
}

/** Atomically updates granted and enabled modules on the workspace. */
export async function updateWorkspaceGrantedAndEnabledModulesRepo(
  subdomain: string,
  grantedModules: Record<string, boolean>,
  enabledModules: Record<string, boolean>,
): Promise<void> {
  await getDb()
    .update(workspacesTable)
    .set({
      grantedModules,
      enabledModules,
    })
    .where(eq(workspacesTable.subdomain, subdomain));
}

export async function deleteWorkspaceRow(subdomain: string): Promise<void> {
  await getDb().delete(workspacesTable).where(eq(workspacesTable.subdomain, subdomain));
}

