import { fetchObject, persistObject } from './dbSyncService.js';

const STORAGE_KEY = 'user_export_artifacts';
const ARTIFACT_TTL_MS = 24 * 60 * 60 * 1000;

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

function pruneExpired(userArtifacts: Record<string, ExportArtifact>): Record<string, ExportArtifact> {
  const now = Date.now();
  const activeArtifacts: Record<string, ExportArtifact> = {};
  for (const [jobId, artifact] of Object.entries(userArtifacts)) {
    if (new Date(artifact.expiresAt).getTime() > now) {
      activeArtifacts[jobId] = artifact;
    }
  }
  return activeArtifacts;
}

export async function saveExportArtifact(
  userId: string,
  jobId: string,
  content: string,
  filename: string,
): Promise<void> {
  const artifactsByUser = await loadUserArtifactMap();
  const userArtifacts = pruneExpired(artifactsByUser[userId] ?? {});
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
  const artifactsByUser = await loadUserArtifactMap();
  const userArtifacts = pruneExpired(artifactsByUser[userId] ?? {});
  const artifact = userArtifacts[jobId];
  if (!artifact) return null;
  if (new Date(artifact.expiresAt).getTime() <= Date.now()) {
    delete userArtifacts[jobId];
    artifactsByUser[userId] = userArtifacts;
    await saveUserArtifactMap(artifactsByUser);
    return null;
  }
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
