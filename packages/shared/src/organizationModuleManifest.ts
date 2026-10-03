/**
 * @file organizationModuleManifest.ts
 * @description Manifest, DTO schemas, and types for organization positions, locations, and charts.
 */

import { z } from 'zod';

export const LOCATION_TYPES = ['campus', 'building', 'wing', 'floor', 'hall', 'room', 'facility'] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const organizationLocationRecordSchema = z.object({
  id: z.string().uuid(),
  workspaceSubdomain: z.string(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES),
  parentLocationId: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  deletedAt: z.string().or(z.date()).nullable().optional(),
});

export type OrganizationLocationRecord = z.infer<typeof organizationLocationRecordSchema>;

export const organizationLocationInsertSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  type: z.enum(LOCATION_TYPES).default('building'),
  parentLocationId: z.string().uuid().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
});

export type OrganizationLocationInsert = z.infer<typeof organizationLocationInsertSchema>;

export const organizationLocationUpdateSchema = organizationLocationInsertSchema.partial();
export type OrganizationLocationUpdate = z.infer<typeof organizationLocationUpdateSchema>;

export const organizationPositionRecordSchema = z.object({
  id: z.string().uuid(),
  workspaceSubdomain: z.string(),
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentId: z.string().min(1),
  designationId: z.string().min(1),
  locationId: z.string().uuid().nullable().optional(),
  parentPositionId: z.string().uuid().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).default(1),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  deletedAt: z.string().or(z.date()).nullable().optional(),
});

export type OrganizationPositionRecord = z.infer<typeof organizationPositionRecordSchema>;

export const organizationPositionInsertSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(255),
  departmentId: z.string().min(1),
  designationId: z.string().min(1),
  locationId: z.string().uuid().nullable().optional(),
  parentPositionId: z.string().uuid().nullable().optional(),
  capacity: z.coerce.number().int().min(1).max(500).default(1),
});

export type OrganizationPositionInsert = z.infer<typeof organizationPositionInsertSchema>;

export const organizationPositionUpdateSchema = organizationPositionInsertSchema.partial();
export type OrganizationPositionUpdate = z.infer<typeof organizationPositionUpdateSchema>;

export const applyBlueprintRequestSchema = z.object({
  blueprintId: z.string().min(1),
  replaceExisting: z.boolean().optional().default(false),
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
  departmentId: string;
  departmentName?: string;
  designationId: string;
  designationName?: string;
  locationId?: string | null;
  locationName?: string | null;
  parentPositionId?: string | null;
  capacity: number;
  occupants: PositionOccupant[];
  vacanciesCount: number;
  children: OrganizationPositionTreeNode[];
}

export const ORGANIZATION_MODULE_MANIFEST = {
  moduleId: 'organization',
  entityType: 'OrganizationPosition',
  collectionKey: 'organization_positions',
  restBasePath: '/api/organization',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'faculty.read',
    write: 'faculty.write',
    delete: 'faculty.delete',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
  },
} as const;
