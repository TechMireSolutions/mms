/**
 * Central route path registry — single source of truth for URLs across the app.
 */

export const ROUTES = {
  home: "/",
  contacts: "/contacts",
  students: "/students",
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
  settings: "/settings",
  login: "/login",
  forgotPassword: "/forgot-password",
  platformForgotPassword: "/platform/forgot-password",
  platformAccount: "/platform/account",
  twoFactor: "/2fa",
  onboarding: "/onboarding",
} as const;

/** Paths that do not require authentication */
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.forgotPassword,
  ROUTES.platformForgotPassword,
  ROUTES.twoFactor,
  ROUTES.onboarding,
];

/**
 * Pre-authenticated entry routes — always English/LTR regardless of saved global language.
 * Includes apex marketing home (`/` on apex host only).
 */
export const ENTRY_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.forgotPassword,
  ROUTES.platformForgotPassword,
  ROUTES.twoFactor,
  ROUTES.onboarding,
];

export function isEntryPath(
  pathname: string,
  options?: { isApex?: boolean }
): boolean {
  if (
    ENTRY_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return true;
  }
  if (options?.isApex && pathname === ROUTES.home) {
    return true;
  }
  return false;
}

/** App-wide settings sections only — module config lives in each module's Configuration tab. */
export const SETTINGS_SECTIONS = [
  "global",
  "modules",
  "branding",
  "theme",
  "backup",
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
];

export function isTenantAppPath(pathname: string): boolean {
  return TENANT_APP_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
