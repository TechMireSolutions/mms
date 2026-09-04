import { asc } from 'drizzle-orm';
import {
  WORKSPACES_COLLECTION,
  PLATFORM_SUPER_USERS_OBJECT_KEY,
  isBackupExcludedObjectKey,
  isServerOnlyObjectKey,
  parseTenantScopedStorageKey,
} from '@mms/shared';
import * as schema from './schema.js';
import { generateSnapshotJsonFromSource } from '../lib/streamingSnapshotJson.js';
import {
  withActiveTransaction,
  type DbClient,
  type LongLivedTenantTransaction,
} from './dbConnection.js';
import { RELATIONAL_REPLACE_MAPPING } from './relationalReplaceMapping.js';
import { stripCredentials } from './relationalSnapshot.js';
import { collectAssetUrlsFromValue, readAssetBase64 } from '../services/backupAssetService.js';

const PAGE_SIZE = 200;

/**
 * Yields `[logicalKey, rows][]` for the tenant's document-store collections, page
 * by page, mirroring `getAllData`'s tenant-scoping and `sanitizeSnapshot`'s
 * `WORKSPACES_COLLECTION` exclusion. Each page is released before the next is
 * read, so peak memory is bounded to one page of collections at a time.
 */
export async function* pageTenantCollections(
  tx: DbClient,
  subdomain: string | null,
): AsyncGenerator<[string, unknown[]]> {
  const tenant = subdomain?.trim().toLowerCase() || '';
  let offset = 0;
  for (;;) {
    const rows = await tx
      .select({ name: schema.collections.name, data: schema.collections.data })
      .from(schema.collections)
      .orderBy(asc(schema.collections.name))
      .limit(PAGE_SIZE)
      .offset(offset);
    if (rows.length === 0) break;

    for (const row of rows) {
      if (row.name === WORKSPACES_COLLECTION) continue;
      const parsed = parseTenantScopedStorageKey(row.name);
      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        yield [parsed.logicalKey, row.data];
      } else if (!parsed) {
        yield [row.name, row.data];
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
}

/**
 * Yields `[logicalKey, value][]` for the tenant's document-store objects, page by
 * page, mirroring `getAllData` (server-only + backup-excluded key exclusion) and
 * `sanitizeSnapshot` (platform super-users exclusion).
 */
export async function* pageTenantObjects(
  tx: DbClient,
  subdomain: string | null,
): AsyncGenerator<[string, unknown]> {
  const tenant = subdomain?.trim().toLowerCase() || '';
  let offset = 0;
  for (;;) {
    const rows = await tx
      .select({ key: schema.objects.key, data: schema.objects.data })
      .from(schema.objects)
      .orderBy(asc(schema.objects.key))
      .limit(PAGE_SIZE)
      .offset(offset);
    if (rows.length === 0) break;

    for (const row of rows) {
      const parsed = parseTenantScopedStorageKey(row.key);
      const logicalKey = parsed?.logicalKey ?? row.key;
      if (isServerOnlyObjectKey(logicalKey)) continue;
      if (isBackupExcludedObjectKey(logicalKey)) continue;
      if (logicalKey === PLATFORM_SUPER_USERS_OBJECT_KEY) continue;
      if (tenant) {
        if (!parsed || parsed.subdomain !== tenant) continue;
        yield [parsed.logicalKey, row.data];
      } else if (!parsed) {
        yield [row.key, row.data];
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
}

export interface StreamDocStoreOptions {
  subdomain: string | null;
  /** Extra objects to emit after the document-store objects (e.g. branding, settings). */
  extraObjects?: AsyncIterable<[string, unknown]>;
}

/**
 * Streams the tenant snapshot JSON (collections + objects [+ extra objects]) from
 * the open transaction's tables, delegating serialization to the shared streaming
 * writer. Caller is responsible for driving the generator to completion inside the
 * long-lived transaction and for committing/rolling back in a `finally`.
 */
export async function* streamTenantDocStoreSnapshot(
  tx: DbClient,
  options: StreamDocStoreOptions,
): AsyncGenerator<string, void, unknown> {
  yield* generateSnapshotJsonFromSource({
    collections: pageTenantCollections(tx, options.subdomain),
    objects: (async function* mergeObjects() {
      yield* pageTenantObjects(tx, options.subdomain);
      if (options.extraObjects) {
        yield* options.extraObjects;
      }
    })(),
  });
}

/**
 * Streams the client-facing `/api/db/sync` snapshot: tenant doc-store collections
 * + objects, plus `branding` and masked `global_settings`, byte-equivalent to
 * `sanitizeSnapshot(fetchDatabaseSnapshot())`. Branding/settings load through the
 * long-lived transaction (via `activeDb()`), so the whole stream reads one
 * consistent snapshot. Caller commits in a `finally` after driving to completion.
 */
export async function* streamSyncSnapshot(
  txn: LongLivedTenantTransaction,
  tenant: string | null,
): AsyncGenerator<string, void, unknown> {
  const extraObjects: [string, unknown][] = [];
  if (tenant) {
    await withActiveTransaction(txn.tx, async () => {
      const [
        { getWorkspaceBranding, getWorkspaceGlobalSettings },
        { maskGlobalSettingsForClient },
      ] = await Promise.all([
        import('./repositories/workspaceRepository.js'),
        import('../services/globalSettingsService.js'),
      ]);
      const [branding, globalSettings] = await Promise.all([
        getWorkspaceBranding(tenant),
        getWorkspaceGlobalSettings(tenant),
      ]);
      if (branding) extraObjects.push(['branding', branding]);
      if (globalSettings) {
        extraObjects.push(['global_settings', maskGlobalSettingsForClient(globalSettings)]);
      }
    });
  }
  async function* extraIter(): AsyncGenerator<[string, unknown], void, undefined> {
    for (const entry of extraObjects) yield entry;
  }
  yield* streamTenantDocStoreSnapshot(txn.tx, { subdomain: tenant, extraObjects: extraIter() });
}

/**
 * Streams the full-fidelity `/api/db/backup` snapshot, byte-equivalent to
 * `sanitizeSnapshot(fetchBackupSnapshot())`:
 * - doc-store collections (skipping relational-overridden keys) + every relational
 *   table, one table at a time (each table's rows are released before the next);
 * - doc-store objects + branding + full global_settings + email_integration;
 * - referenced upload assets, read from disk one at a time.
 *
 * Asset URLs are collected as each collection/object is streamed, so the assets
 * section is emitted after collections/objects complete. The caller must keep the
 * long-lived transaction active (e.g. via `enterActiveTransaction`) so the
 * relational `listRows` helpers and branding/settings loaders join the same
 * transaction, and must commit/roll back in a `finally`.
 */
export async function* streamBackupSnapshot(
  txn: LongLivedTenantTransaction,
  tenant: string | null,
): AsyncGenerator<string, void, unknown> {
  const tx = txn.tx;
  const assetUrls = new Set<string>();

  const relationalKeys = new Set(
    Object.entries(RELATIONAL_REPLACE_MAPPING)
      .filter(([, mapping]) => Boolean(mapping.snapshotFnName))
      .map(([key]) => key),
  );

  async function* collections(): AsyncGenerator<[string, unknown[]]> {
    for await (const [key, rows] of pageTenantCollections(tx, tenant)) {
      if (relationalKeys.has(key)) continue;
      collectAssetUrlsFromValue(rows, assetUrls);
      yield [key, rows];
    }
    for (const [key, mapping] of Object.entries(RELATIONAL_REPLACE_MAPPING)) {
      if (!mapping.snapshotFnName) continue;
      const repo = (await import(mapping.importPath)) as Record<string, unknown>;
      const listRows = repo[mapping.snapshotFnName] as (subdomain: string) => Promise<unknown[]>;
      const rows = await listRows(tenant ?? '');
      const cleaned = stripCredentials(Array.isArray(rows) ? rows : []);
      collectAssetUrlsFromValue(cleaned, assetUrls);
      yield [key, cleaned];
    }
  }

  async function* objects(): AsyncGenerator<[string, unknown]> {
    for await (const [key, value] of pageTenantObjects(tx, tenant)) {
      collectAssetUrlsFromValue(value, assetUrls);
      yield [key, value];
    }
    if (tenant) {
      const extra: Array<[string, unknown]> = [];
      await withActiveTransaction(tx, async () => {
        const { getWorkspaceBranding, getWorkspaceGlobalSettings } = await import(
          './repositories/workspaceRepository.js'
        );
        const [branding, globalSettings] = await Promise.all([
          getWorkspaceBranding(tenant),
          getWorkspaceGlobalSettings(tenant),
        ]);
        if (branding) {
          collectAssetUrlsFromValue(branding, assetUrls);
          extra.push(['branding', branding]);
        }
        if (globalSettings) extra.push(['global_settings', globalSettings]);
        // email_integration is a server-only key (stripped by sanitizeSnapshot),
        // so it is intentionally NOT emitted here to match the /backup contract.
      });
      for (const entry of extra) yield entry;
    }
  }

  async function* assets(): AsyncGenerator<[string, string]> {
    for (const url of assetUrls) {
      const base64 = await readAssetBase64(url);
      if (base64 != null) yield [url, base64];
    }
  }

  yield* generateSnapshotJsonFromSource({ collections: collections(), objects: objects(), assets: assets() });
}
