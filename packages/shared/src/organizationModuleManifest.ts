/**
 * @file organizationModuleManifest.ts
 * @description Manifest, DTO schemas, and types for organization positions, locations, and charts.
 */

import { z } from 'zod';

/** Classification labels for operational sites (not hard-wired behaviour). */
export const LOCATION_TYPES = [
  'head_office',
  'branch',
  'campus',
  'hotel',
  'outlet',
  'store',
  'site',
  'other',
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

const nullableText = z.string().trim().max(255).nullable().optional();

export const organizationLocationRecordSchema = z.object({
  id: z.string().min(1),
  workspaceSubdomain: z.string(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES),
  parentLocationId: z.string().min(1).nullable().optional(),
  addressLine1: nullableText,
  addressLine2: nullableText,
  city: z.string().trim().max(100).nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  timezone: z.string().trim().max(50).nullable().optional(),
  isHeadOffice: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  deletedAt: z.string().or(z.date()).nullable().optional(),
}).strict();

export type OrganizationLocationRecord = z.infer<typeof organizationLocationRecordSchema>;

export const organizationLocationInsertSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES).default('branch'),
  parentLocationId: z.string().min(1).nullable().optional(),
  addressLine1: z.string().trim().max(255).nullable().optional(),
  addressLine2: z.string().trim().max(255).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  region: z.string().trim().max(100).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  postalCode: z.string().trim().max(20).nullable().optional(),
  timezone: z.string().trim().max(50).nullable().optional(),
  isHeadOffice: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
}).strict();

export type OrganizationLocationInsert = z.infer<typeof organizationLocationInsertSchema>;

export const organizationLocationUpdateSchema = organizationLocationInsertSchema.partial().strict();
export type OrganizationLocationUpdate = z.infer<typeof organizationLocationUpdateSchema>;

export const organizationPositionRecordSchema = z.object({
  id: z.string().min(1),
  workspaceSubdomain: z.string(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentId: z.string().min(1).nullable().optional(),
  designationId: z.string().min(1).nullable().optional(),
  locationId: z.string().min(1).nullable().optional(),
  parentPositionId: z.string().min(1).nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).default(1),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  deletedAt: z.string().or(z.date()).nullable().optional(),
}).strict();

export type OrganizationPositionRecord = z.infer<typeof organizationPositionRecordSchema>;

export const organizationPositionInsertSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentId: z.string().min(1).nullable().optional(),
  designationId: z.string().min(1).nullable().optional(),
  locationId: z.string().min(1).nullable().optional(),
  parentPositionId: z.string().min(1).nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).default(1),
  sortOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
}).strict();

export type OrganizationPositionInsert = z.infer<typeof organizationPositionInsertSchema>;

export const organizationPositionUpdateSchema = organizationPositionInsertSchema.partial().strict();
export type OrganizationPositionUpdate = z.infer<typeof organizationPositionUpdateSchema>;

export const applyBlueprintRequestSchema = z.object({
  blueprintId: z.string().min(1),
  replaceExisting: z.boolean().optional().default(false),
}).strict().refine((v) => v.replaceExisting !== true, {
  path: ['replaceExisting'],
  message: 'Destructive blueprint replace is not supported; use apply-missing only',
});

export type ApplyBlueprintRequest = z.infer<typeof applyBlueprintRequestSchema>;

export interface PositionOccupant {
  assignmentId: string;
  facultyId: string;
  facultyName: string;
  employeeId?: string | null;
  avatarUrl?: string | null;
  isPrimary: boolean;
  userId?: string | null;
}

export interface OrganizationPositionTreeNode {
  id: string;
  code: string;
  name: string;
  departmentId?: string | null;
  departmentName?: string;
  designationId?: string | null;
  designationName?: string;
  locationId?: string | null;
  locationName?: string | null;
  parentPositionId?: string | null;
  capacity: number;
  sortOrder?: number;
  isActive?: boolean;
  occupants: PositionOccupant[];
  vacanciesCount: number;
  children: OrganizationPositionTreeNode[];
}

export const ORGANIZATION_MODULE_MANIFEST = {
  moduleId: 'organization',
  entityType: 'OrganizationPosition',
  collectionKey: 'organization_positions',
  restBasePath: '/api/organization',
  tiers: ['work', 'setup'] as const,
  setupSubTabs: ['blueprints'] as const,
  permissions: {
    read: 'organization.read',
    write: 'organization.write',
    delete: 'organization.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
  },
  softDelete: {
    workExcludesDeleted: true,
    reportsIncludeDeleted: false,
    exportsIncludeDeleted: false,
    captureDeletionReason: false,
    retentionDays: null,
  },
} as const;
