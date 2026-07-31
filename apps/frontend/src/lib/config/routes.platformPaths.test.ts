import { describe, expect, it } from 'vitest';
import {
  isPlatformProtectedPath,
  PLATFORM_AUTH_PATHS,
  PLATFORM_ONBOARD_PATHS,
  PLATFORM_PROTECTED_PATHS,
  PLATFORM_SUPER_USER_PATHS,
  ROUTES,
} from '@/lib/config/routes';

describe('platform protected paths', () => {
  it('splits auth-only, onboard, and super-user routes', () => {
    expect(PLATFORM_AUTH_PATHS).toEqual([ROUTES.platformAccount]);
    expect(PLATFORM_ONBOARD_PATHS).toEqual([ROUTES.onboarding]);
    expect(PLATFORM_SUPER_USER_PATHS).toEqual([ROUTES.platformAdmins]);
    expect(PLATFORM_PROTECTED_PATHS).toEqual([
      ROUTES.platformAccount,
      ROUTES.onboarding,
      ROUTES.platformAdmins,
    ]);
  });

  it('matches nested protected paths', () => {
    expect(isPlatformProtectedPath(ROUTES.platformAccount)).toBe(true);
    expect(isPlatformProtectedPath(`${ROUTES.onboarding}/step`)).toBe(true);
    expect(isPlatformProtectedPath(ROUTES.home)).toBe(false);
  });
});
