import type { Permission } from './permissions.js';
import { z } from 'zod';

export const denomRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number(),
  color: z.string(),
  description: z.string(),
  icon: z.string(),
  active: z.boolean(),
});

export type Denomination = z.infer<typeof denomRecordSchema>;
export const denomListSchema = z.array(denomRecordSchema);

export const batchRecordSchema = z.object({
  id: z.string(),
  denominationId: z.string(),
  denominationName: z.string(),
  quantity: z.number(),
  remaining: z.number(),
  addedDate: z.string(),
  addedByUserId: z.string().optional(),
  addedBy: z.string().optional(),
  note: z.string(),
});

export type StockBatch = z.infer<typeof batchRecordSchema>;
export const batchListSchema = z.array(batchRecordSchema);

export const distributionRecordSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  denominationId: z.string(),
  denominationName: z.string(),
  recipientType: z.enum(["student", "faculty"]),
  recipientStudentId: z.string().optional(),
  recipientTeacherId: z.string().optional(),
  recipientName: z.string().optional(),
  recipientClass: z.string(),
  quantity: z.number(),
  reason: z.string(),
  issuedDate: z.string(),
  issuedByUserId: z.string().optional(),
  issuedBy: z.string().optional(),
  status: z.enum(["active", "redeemed", "returned"]),
});

export type Distribution = z.infer<typeof distributionRecordSchema>;
export const distributionListSchema = z.array(distributionRecordSchema);

export const redemptionRecordSchema = z.object({
  id: z.string(),
  distributionId: z.string(),
  studentName: z.string().optional(),
  reward: z.string(),
  pointsUsed: z.number(),
  date: z.string(),
  approvedByUserId: z.string().optional(),
  approvedBy: z.string().optional(),
});

export type Redemption = z.infer<typeof redemptionRecordSchema>;
export const redemptionListSchema = z.array(redemptionRecordSchema);

/** Hasanat Cards module contract — aligns with globle1 universal module architecture. */
export const HASANAT_MODULE_CONTRACT = {
  moduleId: 'hasanat',
  entityType: 'Distribution',
  collectionKey: 'hasanat_distributions',
  batchCollectionKey: 'hasanat_batches',
  denomCollectionKey: 'hasanat_denoms',
  redemptionCollectionKey: 'hasanat_redemptions',
  settingsObjectKey: 'hasanat_settings',
  distributionColumnPreferencesObjectKey: 'hasanat_distribution_user_column_preferences',
  redemptionColumnPreferencesObjectKey: 'hasanat_redemption_user_column_preferences',
  restBasePath: '/api/hasanat',
  analyticsCategory: 'hasanat',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'finance.write',
    write: 'finance.write',
    delete: 'finance.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'finance.write',
    reports: 'finance.write',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['overview', 'stock', 'distribute', 'redemptions'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 15,
} as const;

export type HasanatModuleTier = (typeof HASANAT_MODULE_CONTRACT.tiers)[number];

