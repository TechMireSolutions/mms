import type { PlatformPasswordForgotResult, PlatformUser, StoredPlatformUser } from '@mms/shared';
import {
  normalizePlatformEmail,
  validatePlatformSetupEmail,
  validatePlatformSetupPassword,
  PLATFORM_PASSWORD_RESET_TTL_MINUTES,
} from '@mms/shared';
import {
  createArtifactId,
  deleteAuthArtifact,
  getAuthArtifact,
  putAuthArtifact,
} from '../auth/authArtifactService.js';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
} from '../auth/authCookieService.js';
import { hashPassword } from '../auth/passwordService.js';
import {
  dispatchPlatformVerificationEmail,
  resolvePlatformAppOrigin,
} from './platformEmailService.js';
import {
  findPlatformUserByEmail,
  updatePlatformUserPassword,
} from './platformUserService.js';

const RESET_TTL_MS = PLATFORM_PASSWORD_RESET_TTL_MINUTES * 60 * 1000;

export interface PlatformPasswordResetPayload {
  userId: string;
  email: string;
  codeHash: string;
}

export type PlatformPasswordResetErrorCode =
  | 'invalid_email'
  | 'password_too_short'
  | 'password_weak'
  | 'email_send_failed'
  | 'smtp_required'
  | 'invalid_reset'
  | 'invalid_code';

export class PlatformPasswordResetError extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: PlatformPasswordResetErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PlatformPasswordResetError';

    const statuses: Record<PlatformPasswordResetErrorCode, number> = {
      invalid_email: 400,
      password_too_short: 400,
      password_weak: 400,
      email_send_failed: 502,
      smtp_required: 503,
      invalid_reset: 404,
      invalid_code: 401,
    };
    this.statusCode = statuses[code] ?? 400;
  }
}

function buildResetUrl(resetId: string): string {
  const origin = resolvePlatformAppOrigin();
  return `${origin}/platform/forgot-password?resetId=${encodeURIComponent(resetId)}`;
}

async function dispatchResetCode(email: string, code: string, resetId: string): Promise<{ sent: boolean; devCode?: string }> {
  try {
    return await dispatchPlatformVerificationEmail({
      email,
      code,
      subject: 'Reset your MMS platform password',
      bodyLines: [
        'Use this verification code to reset your platform administrator password:',
        '',
        `Or open this link: ${buildResetUrl(resetId)}`,
      ],
      ttlMinutes: PLATFORM_PASSWORD_RESET_TTL_MINUTES,
      logLabel: 'Platform password reset code',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      throw new PlatformPasswordResetError(
        'smtp_required',
        'Platform email is not configured. Set PLATFORM_RESEND_API_KEY or PLATFORM_SMTP_* and PLATFORM_EMAIL_FROM (GitHub Actions secrets are merged on deploy).',
      );
    }
    throw new PlatformPasswordResetError(
      'email_send_failed',
      error instanceof Error ? error.message : 'Failed to send verification email',
    );
  }
}

/** Always returns accepted — does not reveal whether the email is registered. */
export async function requestPlatformPasswordReset(emailInput: string): Promise<PlatformPasswordForgotResult> {
  const emailError = validatePlatformSetupEmail(emailInput);
  if (emailError) {
    throw new PlatformPasswordResetError('invalid_email', 'Invalid email address');
  }

  const email = normalizePlatformEmail(emailInput);
  const user = await findPlatformUserByEmail(email);
  if (!user) {
    return { accepted: true };
  }

  const code = generateOtpCode();
  const resetId = createArtifactId();

  await putAuthArtifact<PlatformPasswordResetPayload>(
    'platform_password_reset',
    {
      userId: user.id,
      email,
      codeHash: hashOtpCode(code),
    },
    RESET_TTL_MS,
    resetId,
  );

  const dispatch = await dispatchResetCode(email, code, resetId);
  const result: PlatformPasswordForgotResult = { accepted: true };

  if (process.env.NODE_ENV !== 'production' && dispatch.devCode) {
    result.devReset = { resetId, code: dispatch.devCode };
  }

  return result;
}

export async function resendPlatformPasswordReset(resetId: string): Promise<PlatformPasswordForgotResult> {
  const entry = await getAuthArtifact<PlatformPasswordResetPayload>(resetId, 'platform_password_reset');
  if (!entry) {
    throw new PlatformPasswordResetError('invalid_reset', 'Password reset session expired or not found');
  }

  const code = generateOtpCode();
  const updated: PlatformPasswordResetPayload = {
    ...entry.payload,
    codeHash: hashOtpCode(code),
  };
  await deleteAuthArtifact(resetId);
  await putAuthArtifact('platform_password_reset', updated, RESET_TTL_MS, resetId);

  const dispatch = await dispatchResetCode(entry.payload.email, code, resetId);
  const result: PlatformPasswordForgotResult = { accepted: true };

  if (process.env.NODE_ENV !== 'production' && dispatch.devCode) {
    result.devReset = { resetId, code: dispatch.devCode };
  }

  return result;
}

export async function completePlatformPasswordReset(
  resetId: string,
  code: string,
  password: string,
): Promise<StoredPlatformUser> {
  const passwordError = validatePlatformSetupPassword(password);
  if (passwordError === 'platform.setupPasswordTooShort') {
    throw new PlatformPasswordResetError('password_too_short', 'Password does not meet minimum length');
  }
  if (passwordError === 'platform.setupPasswordWeak') {
    throw new PlatformPasswordResetError('password_weak', 'Password does not meet complexity requirements');
  }

  const entry = await getAuthArtifact<PlatformPasswordResetPayload>(resetId, 'platform_password_reset');
  if (!entry) {
    throw new PlatformPasswordResetError('invalid_reset', 'Password reset session expired or not found');
  }

  const normalizedCode = code.replace(/\s/g, '');
  if (!verifyOtpCode(normalizedCode, entry.payload.codeHash)) {
    throw new PlatformPasswordResetError('invalid_code', 'Invalid verification code');
  }

  await deleteAuthArtifact(resetId);

  const passwordHash = await hashPassword(password);
  return updatePlatformUserPassword(entry.payload.userId, passwordHash);
}

export function toPublicPlatformUserFromStored(user: StoredPlatformUser): PlatformUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
