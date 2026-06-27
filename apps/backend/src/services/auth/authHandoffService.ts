import type { AuthResult } from './authService.js';
import { putAuthArtifact, takeAuthArtifact, createArtifactId } from './authArtifactService.js';

const HANDOFF_TTL_MS = 2 * 60 * 1000;

/**
 * One-time auth handoff stored in the database (survives restarts, multi-instance safe).
 */
export async function createAuthHandoff(result: AuthResult): Promise<string> {
  const code = createArtifactId();
  await putAuthArtifact('handoff', result, HANDOFF_TTL_MS, code);
  return code;
}

export async function exchangeAuthHandoff(code: string): Promise<AuthResult | null> {
  const entry = await takeAuthArtifact<AuthResult>(code, 'handoff');
  return entry?.payload ?? null;
}
