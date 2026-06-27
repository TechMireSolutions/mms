/** Global object key for apex platform super-users (not tenant-scoped). */
export const PLATFORM_SUPER_USERS_OBJECT_KEY = 'platform_super_users';

/** Idle minutes before apex platform console auto sign-out. */
export const PLATFORM_IDLE_SESSION_TIMEOUT_MINUTES = 30;

export type PlatformRole = 'super_user' | 'admin';

/** Public platform operator — separate from tenant `User`. */
export interface PlatformUser {
  id: string;
  email: string;
  name: string;
  role: PlatformRole;
}

/** Platform super-user profile returned from `/api/platform/auth/me`. */
export interface PlatformUserProfile extends PlatformUser {
  createdAt?: string;
  emailVerifiedAt?: string;
}

export interface StoredPlatformUser extends PlatformUser {
  passwordHash: string;
  createdAt: string;
  emailVerifiedAt?: string;
}

/** Public setup status for apex first-run wizard. */
export interface PlatformSetupStatus {
  needsSetup: boolean;
  smtpConfigured: boolean;
}

export interface PlatformSetupRegisterResult {
  setupId: string;
  email: string;
  emailSent: boolean;
  /** Dev-only OTP when SMTP is not configured. */
  devCode?: string;
}

export const PLATFORM_SETUP_CODE_TTL_MINUTES = 15;

export const PLATFORM_PASSWORD_RESET_TTL_MINUTES = 15;

export const PLATFORM_MIN_PASSWORD_LENGTH = 10;

export interface PlatformPasswordForgotResult {
  accepted: true;
  /** Non-production hint when platform SMTP is not configured. */
  devReset?: {
    resetId: string;
    code: string;
  };
}
