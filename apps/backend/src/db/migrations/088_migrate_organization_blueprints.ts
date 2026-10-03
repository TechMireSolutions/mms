import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import * as schema from '../schema.js';
import { withGlobalTenant } from '../tenant-context.js';
import { invalidateWorkspaceCache } from '../../services/workspaceService.js';
import { SYSTEM_MODULES } from '@mms/shared';
import { applyOrganizationBlueprint } from '../../services/organizationBlueprintService.js';

/**
 * Migration 088: 
 * 1. Backfills the `tasks` module (and any newly added modules) into existing workspaces' granted/enabled modules.
 * 2. Applies the default `madrasa-standard-v1` organization blueprint to tenants that do not have any locations.
 */
export async function runMigration088(): Promise<void> {
  const db = getDb();
  const workspaces = await db.select().from(schema.workspaces);
  let updatedModulesCount = 0;
  let appliedBlueprintsCount = 0;

  await withGlobalTenant(async (tx) => {
    for (const ws of workspaces) {
      // 1. Backfill modules (specifically tasks)
      let needsModuleUpdate = false;
      const granted = (ws.grantedModules as Record<string, boolean> | null)
        ? { ...(ws.grantedModules as Record<string, boolean>) }
        : {};
      const enabled = (ws.enabledModules as Record<string, boolean> | null)
        ? { ...(ws.enabledModules as Record<string, boolean>) }
        : {};

      for (const mod of SYSTEM_MODULES) {
        if (!Object.prototype.hasOwnProperty.call(granted, mod.id)) {
          granted[mod.id] = true;
          needsModuleUpdate = true;
        }

        if (!Object.prototype.hasOwnProperty.call(enabled, mod.id)) {
          enabled[mod.id] = true;
          needsModuleUpdate = true;
        }
      }

      if (needsModuleUpdate) {
        await tx
          .update(schema.workspaces)
          .set({
            grantedModules: granted,
            enabledModules: enabled,
          })
          .where(eq(schema.workspaces.subdomain, ws.subdomain));

        await invalidateWorkspaceCache(ws.subdomain);
        updatedModulesCount++;
      }

      // 2. Apply default blueprint if no locations exist
      const existingLocations = await tx
        .select({ id: schema.organizationLocations.id })
        .from(schema.organizationLocations)
        .where(eq(schema.organizationLocations.workspaceSubdomain, ws.subdomain))
        .limit(1);

      if (existingLocations.length === 0) {
        try {
          await applyOrganizationBlueprint(ws.subdomain, 'madrasa-standard-v1', 'system');
          appliedBlueprintsCount++;
        } catch (error) {
          console.error(`Failed to apply blueprint for tenant ${ws.subdomain}:`, error);
        }
      }
    }
  });

  console.log(`[Migration 088] Backfilled modules for ${updatedModulesCount} workspace(s).`);
  console.log(`[Migration 088] Applied default blueprint to ${appliedBlueprintsCount} workspace(s).`);
}
