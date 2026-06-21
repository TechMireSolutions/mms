import { fetchObject, persistObject } from './dbSyncService.js';

const STORAGE_KEY = 'user_export_artifacts';
const ARTIFACT_TTL_MS = 24 * 60 * 60 * 1000;

interface ExportArtifact {
  content: string;
  filename: string;
  expiresAt: string;
}

type UserArtifactMap = Record<string, Record<string, ExportArtifact>>;

async function loadMap(): Promise<UserArtifactMap> {
  const raw = await fetchObject(STORAGE_KEY);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as UserArtifactMap;
  }
  return {};
}

async function saveMap(map: UserArtifactMap): Promise<void> {
  await persistObject(STORAGE_KEY, map);
}

function pruneExpired(userArtifacts: Record<string, ExportArtifact>): Record<string, ExportArtifact> {
  const now = Date.now();
  const next: Record<string, ExportArtifact> = {};
  for (const [jobId, artifact] of Object.entries(userArtifacts)) {
    if (new Date(artifact.expiresAt).getTime() > now) {
      next[jobId] = artifact;
    }
  }
  return next;
}

export async function saveExportArtifact(
  userId: string,
  jobId: string,
  content: string,
  filename: string,
): Promise<void> {
  const map = await loadMap();
  const userArtifacts = pruneExpired(map[userId] ?? {});
  userArtifacts[jobId] = {
    content,
    filename,
    expiresAt: new Date(Date.now() + ARTIFACT_TTL_MS).toISOString(),
  };
  map[userId] = userArtifacts;
  await saveMap(map);
}

export async function getExportArtifact(
  userId: string,
  jobId: string,
): Promise<{ content: string; filename: string } | null> {
  const map = await loadMap();
  const userArtifacts = pruneExpired(map[userId] ?? {});
  const artifact = userArtifacts[jobId];
  if (!artifact) return null;
  if (new Date(artifact.expiresAt).getTime() <= Date.now()) {
    delete userArtifacts[jobId];
    map[userId] = userArtifacts;
    await saveMap(map);
    return null;
  }
  return { content: artifact.content, filename: artifact.filename };
}

export async function deleteExportArtifact(userId: string, jobId: string): Promise<void> {
  const map = await loadMap();
  const userArtifacts = map[userId];
  if (!userArtifacts?.[jobId]) return;
  delete userArtifacts[jobId];
  map[userId] = userArtifacts;
  await saveMap(map);
}
