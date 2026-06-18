import type { FastifyReply } from 'fastify';
import type { JWT } from '@fastify/jwt';
import { requiresTwoFactor } from '@mms/shared';
import { validateCredentials, createUser, type PublicUser } from './userService.js';
import { createWorkspace, assertWorkspaceActive, getWorkspaceBySubdomain } from '../workspaceService.js';
import { createAuthHandoff } from './authHandoffService.js';
import { saveObject } from '../../db/database.js';
import type { Workspace } from '@mms/shared';
import { buildBrandingFromOnboarding } from '@mms/shared';
import { assertPasswordMeetsPolicy, getJwtExpiresIn, loadGlobalSettings } from '../globalSettingsService.js';
import { runWithTenant } from '../../lib/tenantContext.js';
import { seedTenantDefaults } from '../tenantSeedService.js';
import { createTwoFactorChallenge, issueRefreshToken } from './twoFactorService.js';
import { setAuthCookies } from './authCookieService.js';
import { clearPlatformAccessCookie } from '../platform/platformCookieService.js';

/** Public user shape re-exported for route usage. */
export type { PublicUser as User };

export interface AuthResult {
  user: PublicUser;
  requires2FA?: boolean;
  challengeId?: string;
  /** Legacy field — cookies are authoritative; omitted in new clients. */
  token?: string;
}

export interface OnboardInput {
  email: string;
  adminName: string;
  password: string;
  subdomain: string;
  madrasaName: string;
  tagline?: string;
  country?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  adminPhone?: string;
  website?: string;
  footerText?: string;
}

export interface OnboardResult extends AuthResult {
  workspace: Workspace;
  handoffCode: string;
}

export async function establishSession(
  user: PublicUser,
  jwtSigner: JWT,
  reply: FastifyReply,
  twoFactorVerified = true,
): Promise<AuthResult> {
  const accessExpiresIn = await getJwtExpiresIn();
  const accessToken = jwtSigner.sign(
    { ...user, twoFactorVerified, tokenType: 'access' },
    { expiresIn: accessExpiresIn },
  );
  const refreshToken = await issueRefreshToken(user);
  clearPlatformAccessCookie(reply);
  setAuthCookies(reply, accessToken, refreshToken);
  return { user };
}

export async function loginUser(
  email: string,
  password: string,
  workspaceSubdomain: string,
  jwtSigner: JWT,
  reply: FastifyReply,
): Promise<AuthResult | null> {
  try {
    await assertWorkspaceActive(workspaceSubdomain);
  } catch (error: unknown) {
    const err = error as Error & { statusCode?: number; type?: string };
    if (err.statusCode === 403 && err.type === 'workspace_disabled') {
      throw err;
    }
    return null;
  }

  const user = await validateCredentials(email, password, workspaceSubdomain);
  if (!user) return null;

  const { getTenantUsersSettings } = await import('../users/usersSettingsService.js');
  const usersSettings = await getTenantUsersSettings();
  if (usersSettings.requireEmailVerification && !user.emailVerifiedAt) {
    const err = new Error('Verify your email before signing in') as Error & {
      statusCode?: number;
      type?: string;
    };
    err.statusCode = 403;
    err.type = 'email_not_verified';
    throw err;
  }

  const settings = await loadGlobalSettings();
  if (requiresTwoFactor(settings, user)) {
    const challengeId = await createTwoFactorChallenge(user);
    return { user, requires2FA: true, challengeId };
  }

  return establishSession(user, jwtSigner, reply, true);
}

export async function completeTwoFactorLogin(
  challengeId: string,
  code: string,
  jwtSigner: JWT,
  reply: FastifyReply,
): Promise<AuthResult | null> {
  const { verifyTwoFactorChallenge } = await import('./twoFactorService.js');
  const user = await verifyTwoFactorChallenge(challengeId, code);
  if (!user) return null;
  return establishSession(user, jwtSigner, reply, true);
}

/** Onboarding is always available for new, unused subdomains. */
export async function isOnboardingAvailable(): Promise<boolean> {
  return true;
}

export async function onboardUser(input: OnboardInput): Promise<OnboardResult> {
  const workspace = await createWorkspace({
    subdomain: input.subdomain,
    madrasaName: input.madrasaName,
    tagline: input.tagline,
    country: input.country,
  });

  await runWithTenant(workspace.subdomain, async () => {
    await seedTenantDefaults();

    const branding = buildBrandingFromOnboarding({
      madrasaName: input.madrasaName,
      tagline: input.tagline,
      subdomain: workspace.subdomain,
      country: input.country,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
      logoUrl: input.logoUrl,
      adminEmail: input.email,
      adminPhone: input.adminPhone,
      website: input.website,
      footerText: input.footerText,
    });
    await saveObject('branding', { ...branding, subdomain: workspace.subdomain });

    await assertPasswordMeetsPolicy(input.password);
    await createUser(input.email, input.adminName, input.password, 'admin', workspace.subdomain);
  });

  const user = await runWithTenant(workspace.subdomain, async () =>
    validateCredentials(input.email, input.password, workspace.subdomain)
  );
  if (!user) {
    throw new Error('Failed to create workspace administrator.');
  }

  const handoffCode = await createAuthHandoff({ user });

  return { user, workspace, handoffCode };
}

export async function resolvePublicWorkspace(subdomain: string): Promise<Workspace | null> {
  return getWorkspaceBySubdomain(subdomain);
}
