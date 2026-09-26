import {
  type PublicWorkspaceSummary,
  type PlatformWorkspaceRow,
  type BrandingSettings,
  BRANDING_IDENTITY_FIELD_KEYS,
  DEFAULT_USERS_SETTINGS,
  mergeBrandingSettings,
  normalizeUserModulePreferences,
  isInstitutionSetupComplete,
  isWorkspaceEnabled,
  toPublicBranding,
} from '@mms/shared';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '../db/database.js';
import { tenantUsers } from '../db/schema.js';
import { hashPassword } from './auth/passwordService.js';
import {
  getWorkspaceBranding,
  getWorkspaceWithBranding,
  listWorkspaceRowsWithBranding,
  updateWorkspaceBrandingRow,
  upsertWorkspaceBranding as upsertWorkspaceBrandingRepo,
} from '../db/repositories/workspaceRepository.js';
import {
  getUserModulePreferencesByWorkspace,
  getUserModulePreferencesByWorkspaces,
} from '../db/repositories/userModulePreferencesRepository.js';
import {
  normalizeSubdomainInput,
  invalidateWorkspaceCache,
} from './workspaceService.js';

/** Public branding for a workspace subdomain (login shell, registry cards). */
export async function fetchPublicBrandingForSubdomain(subdomain: string) {
  const branding = await getWorkspaceBranding(subdomain);
  return toPublicBranding(branding ? branding : mergeBrandingSettings(null));
}

/** Fetch workspace summary and public branding together in a single DB query. */
export async function getWorkspaceWithPublicBranding(subdomain: string) {
  const normalized = normalizeSubdomainInput(subdomain);
  const data = await getWorkspaceWithBranding(normalized);
  if (!data) return null;
  const branding = toPublicBranding(data.branding ? data.branding : mergeBrandingSettings(null));
  return {
    workspace: {
      subdomain: data.workspace.subdomain,
      madrasaName: branding.madrasaName || data.workspace.madrasaName,
      tagline: branding.tagline || data.workspace.tagline,
      enabled: isWorkspaceEnabled(data.workspace),
    },
    branding,
  };
}

/** Workspace-wide setup state derived from authoritative persisted branding. */
export async function getWorkspaceInstitutionSetupStatus(subdomain: string): Promise<boolean> {
  const branding = await getWorkspaceBranding(normalizeSubdomainInput(subdomain));
  return isInstitutionSetupComplete(branding);
}

/** All registered workspaces for apex picker (active only; public name from branding). */
export async function listPublicWorkspaces(): Promise<PublicWorkspaceSummary[]> {
  const rows = await listWorkspaceRowsWithBranding();
  const active = rows.filter(({ workspace }) => isWorkspaceEnabled(workspace));
  return active
    .map(({ workspace, branding }) => {
      const publicBranding = toPublicBranding(branding);
      const logoUrl = publicBranding.logoUrl?.trim();
      return {
        subdomain: workspace.subdomain,
        madrasaName: publicBranding.madrasaName || workspace.madrasaName,
        tagline: publicBranding.tagline || workspace.tagline,
        logoUrl: logoUrl || undefined,
      };
    })
    .sort((a, b) => a.madrasaName.localeCompare(b.madrasaName));
}

/** Fetch map of primary admin emails by workspace subdomain. */
export async function getWorkspaceAdminEmailsMap(subdomains: string[]): Promise<Map<string, string>> {
  if (subdomains.length === 0) return new Map();
  const db = getDb();
  const cleanSubdomains = subdomains.map((s) => s.toLowerCase());
  const rows = await db
    .select({
      subdomain: tenantUsers.workspaceSubdomain,
      email: tenantUsers.loginEmail,
      role: tenantUsers.role,
      createdAt: tenantUsers.createdAt,
    })
    .from(tenantUsers)
    .where(
      and(
        inArray(tenantUsers.workspaceSubdomain, cleanSubdomains),
        isNull(tenantUsers.deletedAt),
      ),
    );

  rows.sort((a: { role?: string; createdAt?: Date | null }, b: { role?: string; createdAt?: Date | null }) => {
    const aIsAdmin = a.role === 'admin' || a.role === 'super_user' ? 0 : 1;
    const bIsAdmin = b.role === 'admin' || b.role === 'super_user' ? 0 : 1;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  });

  const map = new Map<string, string>();
  for (const row of rows) {
    const key = row.subdomain.toLowerCase();
    if (!map.has(key)) {
      map.set(key, row.email);
    }
  }
  return map;
}

/** All workspaces for platform super-user console (includes disabled). */
export async function listPlatformWorkspaces(): Promise<PlatformWorkspaceRow[]> {
  const rows = await listWorkspaceRowsWithBranding();
  const subdomains = rows.map(({ workspace }) => workspace.subdomain);
  const prefsBySubdomain = await getUserModulePreferencesByWorkspaces(subdomains);
  const adminEmailsBySubdomain = await getWorkspaceAdminEmailsMap(subdomains);

  const summaries = rows.map(({ workspace, branding }) => {
    const publicBranding = toPublicBranding(branding);
    const rawPrefs = prefsBySubdomain.get(workspace.subdomain.toLowerCase()) ?? null;
    const prefs = normalizeUserModulePreferences(rawPrefs);
    const logoUrl = publicBranding.logoUrl?.trim();
    const adminEmail = adminEmailsBySubdomain.get(workspace.subdomain.toLowerCase()) || (branding?.email ? branding.email : undefined);
    return {
      subdomain: workspace.subdomain,
      madrasaName: publicBranding.madrasaName || workspace.madrasaName,
      tagline: publicBranding.tagline || workspace.tagline,
      logoUrl: logoUrl || undefined,
      enabled: isWorkspaceEnabled(workspace),
      createdAt: workspace.createdAt,
      requireEmailVerification: prefs.requireEmailVerification ?? DEFAULT_USERS_SETTINGS.requireEmailVerification,
      adminEmail,
    };
  });
  return summaries.sort((a, b) => a.madrasaName.localeCompare(b.madrasaName));
}

/** Reset admin password for a tenant workspace. */
export async function resetWorkspaceAdminPassword(
  subdomain: string,
  newPasswordInput?: string,
): Promise<{ success: true; subdomain: string; adminEmail: string; newPassword: string } | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  const data = await getWorkspaceWithBranding(normalized);
  if (!data) return null;

  const db = getDb();
  const users = await db
    .select({
      id: tenantUsers.id,
      role: tenantUsers.role,
      loginEmail: tenantUsers.loginEmail,
      createdAt: tenantUsers.createdAt,
    })
    .from(tenantUsers)
    .where(
      and(
        eq(tenantUsers.workspaceSubdomain, normalized),
        isNull(tenantUsers.deletedAt),
      ),
    );

  users.sort((a: { role?: string; createdAt?: Date | null }, b: { role?: string; createdAt?: Date | null }) => {
    const aIsAdmin = a.role === 'admin' || a.role === 'super_user' ? 0 : 1;
    const bIsAdmin = b.role === 'admin' || b.role === 'super_user' ? 0 : 1;
    if (aIsAdmin !== bIsAdmin) return aIsAdmin - bIsAdmin;
    return (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
  });

  const targetUser = users[0];
  const fallbackEmail = data.branding?.email?.trim() || `admin@${normalized}.local`;

  const newPassword = newPasswordInput?.trim() || `Mms#${Math.random().toString(36).substring(2, 8)}${Date.now().toString(36).substring(4)}`;
  const passwordHash = await hashPassword(newPassword);

  if (!targetUser) {
    const userId = `usr_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(tenantUsers).values({
      id: userId,
      workspaceSubdomain: normalized,
      loginEmail: fallbackEmail,
      passwordHash,
      name: 'Admin',
      role: 'admin',
      mustChangePassword: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      success: true,
      subdomain: normalized,
      adminEmail: fallbackEmail,
      newPassword,
    };
  }

  await db
    .update(tenantUsers)
    .set({
      passwordHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    })
    .where(eq(tenantUsers.id, targetUser.id));

  return {
    success: true,
    subdomain: normalized,
    adminEmail: targetUser.loginEmail,
    newPassword,
  };
}

/** Single workspace row for platform console (avoids scanning full workspace list). */
export async function getPlatformWorkspaceSummary(
  subdomain: string,
): Promise<PlatformWorkspaceRow | null> {
  const normalized = normalizeSubdomainInput(subdomain);
  const data = await getWorkspaceWithBranding(normalized);
  if (!data) return null;
  const rawPrefs = await getUserModulePreferencesByWorkspace(normalized);
  const prefs = normalizeUserModulePreferences(rawPrefs);
  const publicBranding = toPublicBranding(data.branding ? data.branding : mergeBrandingSettings(null));
  const logoUrl = publicBranding.logoUrl?.trim();
  const adminEmailsMap = await getWorkspaceAdminEmailsMap([normalized]);
  const adminEmail = adminEmailsMap.get(normalized.toLowerCase()) || (data.branding?.email ? data.branding.email : undefined);
  return {
    subdomain: data.workspace.subdomain,
    madrasaName: publicBranding.madrasaName || data.workspace.madrasaName,
    tagline: publicBranding.tagline || data.workspace.tagline,
    logoUrl: logoUrl || undefined,
    enabled: isWorkspaceEnabled(data.workspace),
    createdAt: data.workspace.createdAt,
    requireEmailVerification: prefs.requireEmailVerification ?? DEFAULT_USERS_SETTINGS.requireEmailVerification,
    adminEmail,
  };
}

/** Keeps the global workspace registry in sync with saved branding name/tagline. */
export async function syncWorkspaceFromBranding(
  subdomain: string,
  branding: Pick<BrandingSettings, 'madrasaName' | 'tagline'>,
): Promise<void> {
  const normalized = normalizeSubdomainInput(subdomain);
  await updateWorkspaceBrandingRow(normalized, branding);
  await invalidateWorkspaceCache(normalized);
}

/** Write the full BrandingSettings into the workspaces typed columns. */
export async function upsertWorkspaceBranding(
  subdomain: string,
  branding: BrandingSettings,
): Promise<void> {
  const normalized = normalizeSubdomainInput(subdomain);
  await upsertWorkspaceBrandingRepo(normalized, branding);
  await invalidateWorkspaceCache(normalized);
}

/**
 * Returns a copy of `incoming` with every institution-identity field forced back to
 * `current`'s value — used when the caller lacks `settings.branding.write` so a
 * non-admin save can only ever change the theme fields (colours, corner style,
 * footer), regardless of what the request body contains.
 */
export function sanitizeBrandingWrite(
  incoming: BrandingSettings,
  current: BrandingSettings,
): BrandingSettings {
  const sanitized = { ...incoming };
  for (const key of BRANDING_IDENTITY_FIELD_KEYS) {
    (sanitized as BrandingSettings)[key] = current[key] as never;
  }
  return sanitized;
}
