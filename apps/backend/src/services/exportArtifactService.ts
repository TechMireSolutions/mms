import { USER_EXPORT_ARTIFACTS_OBJECT_KEY } from '@mms/shared';
import { fetchObject, persistObject } from './dbSyncService.js';

const STORAGE_KEY = USER_EXPORT_ARTIFACTS_OBJECT_KEY;
const ARTIFACT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_USER_ARTIFACTS = 10;

interface ExportArtifact {
  content: string;
  filename: string;
  expiresAt: string;
}

type UserArtifactMap = Record<string, Record<string, ExportArtifact>>;

async function loadUserArtifactMap(): Promise<UserArtifactMap> {
  const raw = await fetchObject(STORAGE_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserArtifactMap;
  }
  return {};
}

async function saveUserArtifactMap(artifactsByUser: UserArtifactMap): Promise<void> {
  await persistObject(STORAGE_KEY, artifactsByUser);
}

function pruneAllExpired(allArtifacts: UserArtifactMap): UserArtifactMap {
  const now = Date.now();
  const cleaned: UserArtifactMap = {};
  for (const [user, artifacts] of Object.entries(allArtifacts)) {
    const activeEntries = Object.entries(artifacts)
      .filter(([_, artifact]) => new Date(artifact.expiresAt).getTime() > now)
      .sort((a, b) => new Date(b[1].expiresAt).getTime() - new Date(a[1].expiresAt).getTime())
      .slice(0, MAX_USER_ARTIFACTS);

    if (activeEntries.length > 0) {
      cleaned[user] = Object.fromEntries(activeEntries);
    }
  }
  return cleaned;
}

export async function saveExportArtifact(
  userId: string,
  jobId: string,
  content: string,
  filename: string,
): Promise<void> {
  const artifactsByUser = pruneAllExpired(await loadUserArtifactMap());
  const userArtifacts = artifactsByUser[userId] ?? {};
  userArtifacts[jobId] = {
    content,
    filename,
    expiresAt: new Date(Date.now() + ARTIFACT_TTL_MS).toISOString(),
  };
  artifactsByUser[userId] = userArtifacts;
  await saveUserArtifactMap(artifactsByUser);
}

export async function getExportArtifact(
  userId: string,
  jobId: string,
): Promise<{ content: string; filename: string } | null> {
  const artifactsByUser = pruneAllExpired(await loadUserArtifactMap());
  const userArtifacts = artifactsByUser[userId] ?? {};
  const artifact = userArtifacts[jobId];
  if (!artifact) return null;
  return { content: artifact.content, filename: artifact.filename };
}

export async function deleteExportArtifact(userId: string, jobId: string): Promise<void> {
  const artifactsByUser = await loadUserArtifactMap();
  const userArtifacts = artifactsByUser[userId];
  if (!userArtifacts?.[jobId]) return;
  delete userArtifacts[jobId];
  artifactsByUser[userId] = userArtifacts;
  await saveUserArtifactMap(artifactsByUser);
}
