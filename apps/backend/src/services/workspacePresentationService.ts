import {
  type PublicWorkspaceSummary,
  type PlatformWorkspaceRow,
  type BrandingSettings,
  DEFAULT_USERS_SETTINGS,
  mergeBrandingSettings,
  normalizeUserModulePreferences,
  isInstitutionSetupComplete,
  isWorkspaceEnabled,
  toPublicBranding,
} from '@mms/shared';
import {
  getWorkspaceBranding,
  getWorkspaceWithBranding,
  listWorkspaceRowsWithBranding,
  updateWorkspaceBrandingRow,
  upsertWorkspaceBranding as upsertWorkspaceBrandingRepo,
} from '../db/repositories/workspaceRepository.js';
import { getUserModulePreferencesByWorkspaces } from '../db/repositories/userModulePreferencesRepository.js';
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

/** All workspaces for platform super-user console (includes disabled). */
export async function listPlatformWorkspaces(): Promise<PlatformWorkspaceRow[]> {
  const rows = await listWorkspaceRowsWithBranding();
  const subdomains = rows.map(({ workspace }) => workspace.subdomain);
  const prefsBySubdomain = await getUserModulePreferencesByWorkspaces(subdomains);

  const summaries = rows.map(({ workspace, branding }) => {
    const publicBranding = toPublicBranding(branding);
    const rawPrefs = prefsBySubdomain.get(workspace.subdomain.toLowerCase()) ?? null;
    const prefs = normalizeUserModulePreferences(rawPrefs);
    const logoUrl = publicBranding.logoUrl?.trim();
    return {
      subdomain: workspace.subdomain,
      madrasaName: publicBranding.madrasaName || workspace.madrasaName,
      tagline: publicBranding.tagline || workspace.tagline,
      logoUrl: logoUrl || undefined,
      enabled: isWorkspaceEnabled(workspace),
      createdAt: workspace.createdAt,
      requireEmailVerification: prefs.requireEmailVerification ?? DEFAULT_USERS_SETTINGS.requireEmailVerification,
    };
  });
  return summaries.sort((a, b) => a.madrasaName.localeCompare(b.madrasaName));
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
