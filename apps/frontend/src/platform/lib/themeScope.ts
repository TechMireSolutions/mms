import {
  DEFAULT_BRANDING_SETTINGS,
  DEFAULT_GLOBAL_SETTINGS,
  mergeBrandingSettings,
  mergeGlobalSettings,
  type BrandingSettings,
  type GlobalSettings,
  isApexHost,
} from '@mms/shared';
import { getAppDomain } from '@/lib/config/tenantConfig';

/**
 * Hardcoded MMS platform theme for the apex domain (marketing, console, onboarding).
 * Never reads tenant localStorage or customised institution branding.
 * Platform UI is English-only (LTR).
 */
export const MMS_PLATFORM_BRANDING: BrandingSettings = mergeBrandingSettings(
  DEFAULT_BRANDING_SETTINGS,
);

/** Default global settings on apex (light theme, English). */
export const MMS_PLATFORM_GLOBAL_SETTINGS: GlobalSettings = mergeGlobalSettings(
  DEFAULT_GLOBAL_SETTINGS,
);

/** True when the hostname is a tenant workspace (`{subdomain}.localhost` or `{subdomain}.{platform-domain}`). */
export function isTenantHost(): boolean {
  if (typeof window === 'undefined') return false;
  return !isApexHost(window.location.hostname, getAppDomain());
}

/**
 * Platform apex is always English/LTR. Same lock applies on tenant hosts when the
 * workspace is missing or disabled (platform-themed status screens).
 */
export function shouldForcePlatformEnglish(options: {
  isApex: boolean;
  workspaceLoading: boolean;
  workspace: { enabled?: boolean } | null;
}): boolean {
  if (options.isApex) return true;
  if (options.workspaceLoading) return false;
  return options.workspace === null || options.workspace.enabled === false;
}
