import type { Permission } from './permissions.js';
import { z } from 'zod';

export const obligationTypeRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity_based: z.boolean(),
  designated_for: z.enum(["Syed", "Non-Syed", "Both", "None"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ObligationType = z.infer<typeof obligationTypeRecordSchema>;
export const obligationTypeListSchema = z.array(obligationTypeRecordSchema);

export const mujtahidRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Mujtahid = z.infer<typeof mujtahidRecordSchema>;
export const mujtahidListSchema = z.array(mujtahidRecordSchema);

export const mujtahidRepRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  mujtahid_id: z.string(),
});

export type MujtahidRep = z.infer<typeof mujtahidRepRecordSchema>;
export const mujtahidRepListSchema = z.array(mujtahidRepRecordSchema);

export const wakalaTypeRecordSchema = z.object({
  id: z.string(),
  mujtahid_representative_id: z.string(),
  obligation_type_id: z.string(),
});

export type WakalaType = z.infer<typeof wakalaTypeRecordSchema>;
export const wakalaTypeListSchema = z.array(wakalaTypeRecordSchema);

export const obligationDistributionRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  percentage: z.number(),
  wakala_type_id: z.string(),
  type: z.enum(["Liability", "Income"]),
});

export type ObligationDistribution = z.infer<typeof obligationDistributionRecordSchema>;
export const obligationDistributionListSchema = z.array(obligationDistributionRecordSchema);

export const obligationCollectionRecordSchema = z.object({
  id: z.string(),
  receipt_no: z.string(),
  received_date: z.string(),
  sender_id: z.string(),
  reference_id: z.string().nullable(),
  amount: z.number(),
  currency_id: z.string(),
  payment_mode: z.enum(["Cash", "Online"]),
  obligation_type_id: z.string(),
  mujtahid_representative_id: z.string(),
  received_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ObligationCollection = z.infer<typeof obligationCollectionRecordSchema>;
export const obligationCollectionListSchema = z.array(obligationCollectionRecordSchema);

/** Obligations module contract — aligns with globle1 universal module architecture. */
export const OBLIGATIONS_MODULE_CONTRACT = {
  moduleId: 'obligations',
  entityType: 'ObligationCollection',
  collectionKey: 'obligation_collections',
  settingsObjectKey: 'obligations_settings',
  columnPreferencesObjectKey: 'obligations_user_column_preferences',
  restBasePath: '/api/obligations',
  analyticsCategory: 'obligations',
  tiers: ['work', 'reports', 'setup'] as const,
  permissions: {
    read: 'obligations.write',
    write: 'obligations.write',
    delete: 'obligations.write',
    setupView: 'configuration.view',
    setupWrite: 'settings.global.write',
    export: 'obligations.write',
    reports: 'obligations.write',
  } satisfies Record<string, Permission>,
  work: {
    directoryViews: ['summary', 'collections'] as const,
    bulkActions: [] as const,
  },
  defaultPageSize: 12,
} as const;

export type ObligationsModuleTier = (typeof OBLIGATIONS_MODULE_CONTRACT.tiers)[number];
