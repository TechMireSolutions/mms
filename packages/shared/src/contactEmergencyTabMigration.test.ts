import { describe, expect, it } from 'vitest';
import { migrateEmergencyTabToRelationship } from './contactEmergencyTabMigration.js';
import type { FieldConfig } from './contactFieldSchemaTypes.js';

describe('migrateEmergencyTabToRelationship', () => {
  it('remaps emergency tab, fields, enabled tabs, and columns', () => {
    const legacy: FieldConfig = {
      version: 2,
      enabledTabs: ['phones', 'emergency'],
      requiredTabs: ['emergency'],
      formTabs: [
        { key: 'emergency', label: 'Emergency', enabled: true, order: 5 },
      ],
      fields: {
        emergency: [{ key: 'contactId', label: 'Contact', type: 'text', enabled: true, order: 0 }],
      },
      columnRegistry: [
        { key: 'emergency_contact', label: 'Emergency Contact', enabled: false, order: 15 },
        { key: 'emergency_relationship', label: 'Emergency Relationship', enabled: false, order: 16 },
      ],
    };

    const migrated = migrateEmergencyTabToRelationship(legacy);
    expect(migrated.enabledTabs).toEqual(['phones', 'relationship']);
    expect(migrated.requiredTabs).toEqual(['relationship']);
    expect(migrated.formTabs?.[0]?.key).toBe('relationship');
    expect(migrated.formTabs?.[0]?.label).toBe('Relationship');
    expect(migrated.fields?.relationship).toEqual(legacy.fields?.emergency);
    expect(migrated.fields?.emergency).toBeUndefined();
    expect(migrated.columnRegistry?.map((column) => column.key)).toEqual([
      'relationship_contact',
      'relationship_type',
    ]);
  });

  it('is idempotent', () => {
    const once = migrateEmergencyTabToRelationship({
      version: 2,
      enabledTabs: ['relationship'],
      requiredTabs: [],
      fields: {
        relationship: [{ key: 'contactId', label: 'Contact', type: 'text', enabled: true, order: 0 }],
      },
    });
    expect(migrateEmergencyTabToRelationship(once)).toEqual(once);
  });
});
