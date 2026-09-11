import {
  feeStructureInsertSchema,
  feeStructureRecordSchema,
  type FeeStructure,
  type FeeStructureInsert,
} from '@mms/shared';
import { requireTenant } from '../../lib/tenantContext.js';
import {
  deleteFeeStructure,
  listFeeStructures,
  saveFeeStructure,
} from '../../db/repositories/financeBillingRepository.js';

export async function loadFeeStructures(): Promise<FeeStructure[]> {
  return listFeeStructures(requireTenant());
}

export async function upsertFeeStructure(input: FeeStructureInsert): Promise<FeeStructure> {
  const tenant = requireTenant();
  const parsed = feeStructureInsertSchema.parse(input);
  const record: FeeStructure = feeStructureRecordSchema.parse({
    ...parsed,
    id: parsed.id || `fs-${Date.now()}`,
    items: (parsed.items ?? []).map((item, index) => ({
      ...item,
      id: item.id ?? `fi-${index + 1}`,
    })),
  });
  await saveFeeStructure(tenant, record);
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_fee_structures');
  return record;
}

export async function removeFeeStructure(id: string): Promise<void> {
  const tenant = requireTenant();
  await deleteFeeStructure(tenant, id);
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_fee_structures');
}
