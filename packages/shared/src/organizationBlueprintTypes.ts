/**
 * @file organizationBlueprintTypes.ts
 * @description Industry-specific organizational templates for positions, locations, and departments.
 */

import { z } from 'zod';
import { LOCATION_TYPES } from './organizationModuleManifest.js';
import {
  MADRASA_STANDARD_V1_BLUEPRINT,
  HOTEL_STANDARD_V1_BLUEPRINT,
  OFFICE_STANDARD_V1_BLUEPRINT,
  RETAIL_STANDARD_V1_BLUEPRINT,
} from './organizationBlueprintCatalog.js';
import { HOTEL_STANDARD_V2_BLUEPRINT } from './organizationBlueprints/hotelStandardV2.js';

export const INDUSTRY_TYPES = ['madrasa', 'hotel', 'office', 'retail', 'custom', 'general'] as const;
export type IndustryType = (typeof INDUSTRY_TYPES)[number];

export const blueprintLocationSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES).default('branch'),
  parentCode: z.string().max(64).optional(),
});

export type BlueprintLocation = z.infer<typeof blueprintLocationSchema>;

export const blueprintDepartmentSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
});

export type BlueprintDepartment = z.infer<typeof blueprintDepartmentSchema>;

export const blueprintDesignationSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  level: z.number().int().min(1).max(99).default(10),
});

export type BlueprintDesignation = z.infer<typeof blueprintDesignationSchema>;

export const blueprintPositionSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentCode: z.string().min(1).max(64),
  designationCode: z.string().min(1).max(64),
  locationCode: z.string().max(64).optional(),
  parentPositionCode: z.string().max(64).optional(),
  capacity: z.number().int().min(1).max(500).default(1),
});

export type BlueprintPosition = z.infer<typeof blueprintPositionSchema>;

export const organizationBlueprintSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  industryType: z.enum(INDUSTRY_TYPES),
  version: z.number().int().min(1).default(1),
  description: z.string(),
  locations: z.array(blueprintLocationSchema),
  departments: z.array(blueprintDepartmentSchema),
  designations: z.array(blueprintDesignationSchema),
  positions: z.array(blueprintPositionSchema),
});

export type OrganizationBlueprint = z.infer<typeof organizationBlueprintSchema>;

export {
  MADRASA_STANDARD_V1_BLUEPRINT,
  HOTEL_STANDARD_V1_BLUEPRINT,
  OFFICE_STANDARD_V1_BLUEPRINT,
  RETAIL_STANDARD_V1_BLUEPRINT,
} from './organizationBlueprintCatalog.js';
export { HOTEL_STANDARD_V2_BLUEPRINT };

export const ORGANIZATION_BLUEPRINTS: readonly OrganizationBlueprint[] = [
  MADRASA_STANDARD_V1_BLUEPRINT,
  HOTEL_STANDARD_V1_BLUEPRINT,
  HOTEL_STANDARD_V2_BLUEPRINT,
  OFFICE_STANDARD_V1_BLUEPRINT,
  RETAIL_STANDARD_V1_BLUEPRINT,
];

export function findBlueprintById(id: string): OrganizationBlueprint | undefined {
  return ORGANIZATION_BLUEPRINTS.find((b) => b.id === id);
}

export function getBlueprintsForIndustry(industry: IndustryType): OrganizationBlueprint[] {
  return ORGANIZATION_BLUEPRINTS.filter((b) => b.industryType === industry);
}
