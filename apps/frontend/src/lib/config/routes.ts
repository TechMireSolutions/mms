/**
 * Central route path registry — single source of truth for URLs across the app.
 */

export const ROUTES = {
  home: "/",
  contacts: "/contacts",
  students: "/students",
  teachers: "/teachers",
  enrollments: "/enrollments",
  sessions: "/sessions",
  attendance: "/attendance",
  finance: "/finance",
  hasanatCards: "/hasanat-cards",
  examinations: "/examinations",
  questionBank: "/question-bank",
  accounting: "/accounting",
  obligations: "/obligations",
  users: "/users",
  profile: "/profile",
  settings: "/settings",
  messaging: "/messaging",
  login: "/login",
  forgotPassword: "/forgot-password",
  platformForgotPassword: "/platform/forgot-password",
  platformAccount: "/platform/account",
  twoFactor: "/2fa",
  onboarding: "/onboarding",
} as const;

/** Paths that do not require tenant authentication */
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.forgotPassword,
  ROUTES.platformForgotPassword,
  ROUTES.twoFactor,
];

/**
 * Platform apex paths reachable without a platform super-user session.
 * Setup/sign-in/console share `/`; tenant module URLs show the workspace gate.
 */
export const PLATFORM_ENTRY_PATHS: readonly string[] = [
  ROUTES.home,
  ROUTES.forgotPassword,
  ROUTES.platformForgotPassword,
  ROUTES.twoFactor,
];

/** Platform paths that require platform super-user authentication. */
export const PLATFORM_PROTECTED_PATHS: readonly string[] = [
  ROUTES.onboarding,
  ROUTES.platformAccount,
];

/**
 * Pre-authenticated entry routes — always English/LTR regardless of saved global language.
 * Tenant: login, forgot, 2FA. Apex: {@link PLATFORM_ENTRY_PATHS} plus workspace gate URLs.
 */
export const ENTRY_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.forgotPassword,
  ROUTES.platformForgotPassword,
  ROUTES.twoFactor,
];

/** True when pathname is an apex workspace-picker gate (tenant module URL on platform host). */
export function isPlatformWorkspaceGatePath(pathname: string): boolean {
  if (pathname === ROUTES.settings || pathname.startsWith(`${ROUTES.settings}/`)) {
    return true;
  }
  return isTenantAppPath(pathname);
}

/** True when unauthenticated users may view this path on the platform apex host. */
export function isPlatformEntryPath(pathname: string): boolean {
  if (
    PLATFORM_ENTRY_PATHS.some(
      (path) => pathname === path || (path !== ROUTES.home && pathname.startsWith(`${path}/`)),
    )
  ) {
    return true;
  }
  return isPlatformWorkspaceGatePath(pathname);
}

export function isPlatformProtectedPath(pathname: string): boolean {
  return PLATFORM_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isEntryPath(
  pathname: string,
  options?: { isApex?: boolean }
): boolean {
  if (options?.isApex) {
    return isPlatformEntryPath(pathname);
  }
  if (
    ENTRY_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return true;
  }
  if (pathname === ROUTES.onboarding) {
    return true;
  }
  return false;
}

/** App-wide settings sections only — module config lives in each module's Setup tab. */
export const SETTINGS_SECTIONS = [
  "global",
  "modules",
  "branding",
  "theme",
  "backup",
  "llm",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

/** Active state for sidebar / nav links. */
export function isNavPathActive(pathname: string, itemPath: string): boolean {
  if (itemPath === ROUTES.home) {
    return pathname === ROUTES.home;
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/** Default post-login destination */
export const DEFAULT_AUTH_REDIRECT = ROUTES.home;

/** Tenant app module paths — not available on the apex host. */
export const TENANT_APP_PATHS: readonly string[] = [
  ROUTES.contacts,
  ROUTES.students,
  ROUTES.teachers,
  ROUTES.enrollments,
  ROUTES.sessions,
  ROUTES.attendance,
  ROUTES.finance,
  ROUTES.hasanatCards,
  ROUTES.examinations,
  ROUTES.questionBank,
  ROUTES.accounting,
  ROUTES.obligations,
  ROUTES.users,
  ROUTES.profile,
];

export function isTenantAppPath(pathname: string): boolean {
  return TENANT_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
