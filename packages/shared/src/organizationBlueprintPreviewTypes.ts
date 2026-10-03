/**
 * @file organizationBlueprintPreviewTypes.ts
 * @description Pure DTO schema for organizational blueprint preview and diff comparison.
 */

export interface BlueprintPreviewDiff {
  blueprintId: string;
  industryType: string;
  departments: {
    existing: Array<{ code: string; name: string }>;
    toCreate: Array<{ code: string; name: string }>;
  };
  designations: {
    existing: Array<{ code: string; name: string }>;
    toCreate: Array<{ code: string; name: string }>;
  };
  locations: {
    existing: Array<{ code: string; name: string; type: string }>;
    toCreate: Array<{ code: string; name: string; type: string }>;
  };
  positions: {
    existing: Array<{ code: string; name: string }>;
    toCreate: Array<{ code: string; name: string }>;
  };
  counts: {
    existingTotal: number;
    toCreateTotal: number;
  };
}
