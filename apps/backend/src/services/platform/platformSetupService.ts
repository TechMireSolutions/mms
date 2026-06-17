import type {
  PlatformSetupRegisterResult,
  PlatformSetupStatus,
  PlatformUser,
  StoredPlatformUser,
} from '@mms/shared';
import {
  normalizePlatformEmail,
  validatePlatformSetupEmail,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
  PLATFORM_SETUP_CODE_TTL_MINUTES,
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
  countPlatformUsers,
  createVerifiedPlatformUser,
  hasPlatformUsers,
} from './platformUserService.js';
import { isPlatformSmtpConfigured, dispatchPlatformVerificationEmail } from './platformEmailService.js';

const SETUP_TTL_MS = PLATFORM_SETUP_CODE_TTL_MINUTES * 60 * 1000;

export interface PlatformSetupPayload {
  email: string;
  name: string;
  passwordHash: string;
  codeHash: string;
}

export type PlatformSetupErrorCode =
  | 'setup_not_needed'
  | 'invalid_email'
  | 'invalid_name'
  | 'password_too_short'
  | 'password_weak'
  | 'email_send_failed'
  | 'smtp_required'
  | 'invalid_setup'
  | 'invalid_code'
  | 'user_exists';

export class PlatformSetupError extends Error {
  constructor(
    readonly code: PlatformSetupErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'PlatformSetupError';
  }
}

export async function getPlatformSetupStatus(): Promise<PlatformSetupStatus> {
  const needsSetup = !(await hasPlatformUsers());
  return {
    needsSetup,
    smtpConfigured: isPlatformSmtpConfigured(),
  };
}

async function dispatchSetupCode(email: string, code: string): Promise<{ sent: boolean; devCode?: string }> {
  try {
    return await dispatchPlatformVerificationEmail({
      email,
      code,
      subject: 'Confirm your MMS platform administrator account',
      bodyLines: ['Use this verification code to complete platform administrator setup:'],
      ttlMinutes: PLATFORM_SETUP_CODE_TTL_MINUTES,
      logLabel: 'Platform setup verification code',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not configured')) {
      throw new PlatformSetupError(
        'smtp_required',
        'Platform email is not configured. Set PLATFORM_SMTP_* and PLATFORM_EMAIL_FROM in the backend environment.',
      );
    }
    throw new PlatformSetupError(
      'email_send_failed',
      error instanceof Error ? error.message : 'Failed to send verification email',
    );
  }
}

export async function startPlatformSetup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PlatformSetupRegisterResult> {
  if (await hasPlatformUsers()) {
    throw new PlatformSetupError('setup_not_needed', 'Platform administrator already exists');
  }

  const emailError = validatePlatformSetupEmail(input.email);
  if (emailError) {
    throw new PlatformSetupError('invalid_email', 'Invalid email address');
  }
  const nameError = validatePlatformSetupName(input.name);
  if (nameError) {
    throw new PlatformSetupError('invalid_name', 'Invalid display name');
  }
  const passwordError = validatePlatformSetupPassword(input.password);
  if (passwordError === 'platform.setupPasswordTooShort') {
    throw new PlatformSetupError('password_too_short', 'Password does not meet minimum length');
  }
  if (passwordError === 'platform.setupPasswordWeak') {
    throw new PlatformSetupError('password_weak', 'Password does not meet complexity requirements');
  }

  const email = normalizePlatformEmail(input.email);
  const code = generateOtpCode();
  const setupId = createArtifactId();
  const passwordHash = await hashPassword(input.password);

  await putAuthArtifact<PlatformSetupPayload>(
    'platform_setup',
    {
      email,
      name: input.name.trim(),
      passwordHash,
      codeHash: hashOtpCode(code),
    },
    SETUP_TTL_MS,
    setupId,
  );

  const dispatch = await dispatchSetupCode(email, code);

  return {
    setupId,
    email,
    emailSent: dispatch.sent,
    devCode: dispatch.devCode,
  };
}

export async function resendPlatformSetupCode(setupId: string): Promise<PlatformSetupRegisterResult> {
  if (await hasPlatformUsers()) {
    throw new PlatformSetupError('setup_not_needed', 'Platform administrator already exists');
  }

  const entry = await getAuthArtifact<PlatformSetupPayload>(setupId, 'platform_setup');
  if (!entry) {
    throw new PlatformSetupError('invalid_setup', 'Setup session expired or not found');
  }

  const code = generateOtpCode();
  const updated: PlatformSetupPayload = {
    ...entry.payload,
    codeHash: hashOtpCode(code),
  };
  await deleteAuthArtifact(setupId);
  await putAuthArtifact('platform_setup', updated, SETUP_TTL_MS, setupId);

  const dispatch = await dispatchSetupCode(entry.payload.email, code);

  return {
    setupId,
    email: entry.payload.email,
    emailSent: dispatch.sent,
    devCode: dispatch.devCode,
  };
}

export async function verifyPlatformSetup(
  setupId: string,
  code: string,
): Promise<StoredPlatformUser> {
  if ((await countPlatformUsers()) > 0) {
    throw new PlatformSetupError('setup_not_needed', 'Platform administrator already exists');
  }

  const entry = await getAuthArtifact<PlatformSetupPayload>(setupId, 'platform_setup');
  if (!entry) {
    throw new PlatformSetupError('invalid_setup', 'Setup session expired or not found');
  }

  const normalizedCode = code.replace(/\s/g, '');
  if (!verifyOtpCode(normalizedCode, entry.payload.codeHash)) {
    throw new PlatformSetupError('invalid_code', 'Invalid verification code');
  }

  await deleteAuthArtifact(setupId);

  return createVerifiedPlatformUser({
    email: entry.payload.email,
    name: entry.payload.name,
    passwordHash: entry.payload.passwordHash,
  });
}

export function toPublicPlatformUser(user: StoredPlatformUser): PlatformUser {
  return { id: user.id, email: user.email, name: user.name };
}
