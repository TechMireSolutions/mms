import type {
  PlatformSetupRegisterResult,
  PlatformSetupStatus,
  StoredPlatformUser,
} from '@mms/shared';
import {
  normalizePlatformEmail,
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
import { isPlatformSmtpConfigured } from './platformEmailService.js';
import { PlatformError, type PlatformErrorCode } from './platformErrorService.js';
import { dispatchPlatformOtp } from './platformOtpService.js';
import {
  enforcePlatformEmail,
  enforcePlatformName,
  enforcePlatformPassword,
  buildSetupRegisterResult,
} from './platformValidationService.js';

const SETUP_TTL_MS = PLATFORM_SETUP_CODE_TTL_MINUTES * 60 * 1000;

export interface PlatformSetupPayload {
  email: string;
  name: string;
  passwordHash: string;
  codeHash: string;
}

export type PlatformSetupErrorCode = PlatformErrorCode;
export const PlatformSetupError = PlatformError;

export async function getPlatformSetupStatus(): Promise<PlatformSetupStatus> {
  const needsSetup = !(await hasPlatformUsers());
  return {
    needsSetup,
    smtpConfigured: isPlatformSmtpConfigured(),
  };
}

async function dispatchSetupCode(email: string, code: string): Promise<{ sent: boolean; devCode?: string }> {
  return dispatchPlatformOtp({
    email,
    code,
    subject: 'Confirm your MMS platform administrator account',
    bodyLines: ['Use this verification code to complete platform administrator setup:'],
    ttlMinutes: PLATFORM_SETUP_CODE_TTL_MINUTES,
    logLabel: 'Platform setup verification code',
  });
}

export async function startPlatformSetup(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PlatformSetupRegisterResult> {
  if (await hasPlatformUsers()) {
    throw new PlatformSetupError('setup_not_needed', 'Platform administrator already exists');
  }

  enforcePlatformEmail(input.email);
  enforcePlatformName(input.name);
  enforcePlatformPassword(input.password);

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

  return buildSetupRegisterResult(dispatch, setupId, email);
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

  return buildSetupRegisterResult(dispatch, setupId, entry.payload.email);
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


