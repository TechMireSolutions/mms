import { beforeAll, describe, expect, it } from 'vitest';
import { getObject, saveObject, getAllData, initDb } from '../db/database.js';
import { runWithTenant } from '../lib/tenantContext.js';

describe('custom tabs relational migration and operations', () => {
  beforeAll(async () => {
    // Set test environment secrets
    process.env.JWT_SECRET = 'test-secret';
    // Initialize database connection
    await initDb();
  });

  it('saves, hydrates, and gets custom tabs dynamically', async () => {
    await runWithTenant('demo', async () => {
      const configKey = 'contact_field_config';
      
      // Save initial state to avoid side-effects
      const originalObject = await getObject(configKey);

      try {
        const mockConfigPayload = {
          version: 42,
          fields: {
            firstName: { key: 'firstName', type: 'text', required: true },
          },
          formTabs: [
            { key: 'basic', label: 'Basic Info', enabled: true, order: 0 },
            { key: 'custom_sub_tab', label: 'Additional Data', enabled: true, order: 1, color: 'blue' },
          ],
        };

        // 1. Save object with custom formTabs
        await saveObject(configKey, mockConfigPayload);

        // 2. Fetch the object and verify hydration
        const fetched = await getObject(configKey) as any;
        expect(fetched).not.toBeNull();
        expect(fetched.version).toBe(42);
        expect(fetched.fields.firstName.key).toBe('firstName');
        expect(fetched.formTabs).toBeDefined();
        expect(fetched.formTabs.length).toBe(2);
        expect(fetched.formTabs[0].key).toBe('basic');
        expect(fetched.formTabs[1].key).toBe('custom_sub_tab');
        expect(fetched.formTabs[1].color).toBe('blue');

        // 3. Verify in getAllData
        const snapshot = await getAllData();
        const snapshotConfig = snapshot.objects[configKey] as any;
        expect(snapshotConfig).toBeDefined();
        expect(snapshotConfig.formTabs).toBeDefined();
        expect(snapshotConfig.formTabs.length).toBe(2);
        expect(snapshotConfig.formTabs[1].key).toBe('custom_sub_tab');
      } finally {
        // Restore original object state
        if (originalObject) {
          await saveObject(configKey, originalObject);
        }
      }
    });
  });
});
