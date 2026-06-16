import { randomBytes } from 'node:crypto';
import type { JWT } from '@fastify/jwt';
import type { User } from '@mms/shared';
import { resolveNotificationChannel } from '@mms/shared';
import {
  createArtifactId,
  deleteAuthArtifact,
  findRefreshTokenByHash,
  getAuthArtifact,
  putAuthArtifact,
  takeAuthArtifact,
} from './authArtifactService.js';
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpCode,
  createRefreshTokenValue,
  hashRefreshToken,
} from './authCookieService.js';
import { getPublicUserById } from './userService.js';
import { loadGlobalSettings } from '../globalSettingsService.js';
import { sendTenantEmail } from '../email/emailService.js';
import { runWithTenant } from '../../lib/tenantContext.js';

const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TwoFactorChallengePayload {
  userId: string;
  email: string;
  workspaceSubdomain: string;
  codeHash: string;
}

export interface RefreshTokenPayload {
  userId: string;
  workspaceSubdomain: string;
  tokenHash: string;
}

export async function createTwoFactorChallenge(user: User): Promise<string> {
  const code = generateOtpCode();
  const challengeId = createArtifactId();
  await putAuthArtifact<TwoFactorChallengePayload>(
    'two_factor_challenge',
    {
      userId: user.id,
      email: user.email,
      workspaceSubdomain: user.workspaceSubdomain,
      codeHash: hashOtpCode(code),
    },
    CHALLENGE_TTL_MS,
    challengeId,
  );
  await dispatchTwoFactorCode(user.email, code);
  return challengeId;
}

export async function resendTwoFactorChallenge(challengeId: string): Promise<boolean> {
  const entry = await getAuthArtifact<TwoFactorChallengePayload>(challengeId, 'two_factor_challenge');
  if (!entry) return false;

  const code = generateOtpCode();
  entry.payload.codeHash = hashOtpCode(code);
  await deleteAuthArtifact(challengeId);
  await putAuthArtifact('two_factor_challenge', entry.payload, CHALLENGE_TTL_MS, challengeId);
  await dispatchTwoFactorCode(entry.payload.email, code);
  return true;
}

export async function verifyTwoFactorChallenge(
  challengeId: string,
  code: string,
): Promise<User | null> {
  const entry = await takeAuthArtifact<TwoFactorChallengePayload>(challengeId, 'two_factor_challenge');
  if (!entry) return null;
  if (!verifyOtpCode(code.replace(/\s/g, ''), entry.payload.codeHash)) return null;

  const user = await runWithTenant(entry.payload.workspaceSubdomain, () =>
    getPublicUserById(entry.payload.userId),
  );
  if (!user) return null;
  if (user.workspaceSubdomain !== entry.payload.workspaceSubdomain) return null;
  return user;
}

async function dispatchTwoFactorCode(email: string, code: string): Promise<void> {
  const settings = await loadGlobalSettings();
  const channel = resolveNotificationChannel(settings);

  if (channel === 'email') {
    await sendTenantEmail({
      to: email,
      subject: 'MMS verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info(`[MMS] 2FA code (${channel}): ${code}`);
  }
}

export async function issueRefreshToken(user: User): Promise<string> {
  const refreshToken = createRefreshTokenValue();
  await putAuthArtifact<RefreshTokenPayload>(
    'refresh_token',
    {
      userId: user.id,
      workspaceSubdomain: user.workspaceSubdomain,
      tokenHash: hashRefreshToken(refreshToken),
    },
    REFRESH_TTL_MS,
    randomBytes(16).toString('hex'),
  );
  return refreshToken;
}

export async function rotateRefreshToken(
  _presentedToken: string,
  user: User,
  jwtSigner: JWT,
  accessExpiresIn: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  // Rotation: issue new pair; old refresh artifact was deleted by the caller.
  const refreshToken = createRefreshTokenValue();
  await putAuthArtifact<RefreshTokenPayload>(
    'refresh_token',
    {
      userId: user.id,
      workspaceSubdomain: user.workspaceSubdomain,
      tokenHash: hashRefreshToken(refreshToken),
    },
    REFRESH_TTL_MS,
    randomBytes(16).toString('hex'),
  );

  const accessToken = jwtSigner.sign(
    { ...user, twoFactorVerified: true, tokenType: 'access' },
    { expiresIn: accessExpiresIn },
  );

  return { accessToken, refreshToken };
}

export async function validateRefreshToken(
  presentedToken: string,
  workspaceSubdomain: string,
): Promise<{ payload: RefreshTokenPayload; artifactId: string } | null> {
  if (!presentedToken) return null;

  const record = await findRefreshTokenByHash<RefreshTokenPayload>(
    hashRefreshToken(presentedToken),
  );
  if (!record) return null;
  if (record.payload.workspaceSubdomain.toLowerCase() !== workspaceSubdomain.toLowerCase()) {
    return null;
  }

  return { payload: record.payload, artifactId: record.id };
}
