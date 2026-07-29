import type {
  GenericSavedReportCategory,
  GenericSavedReportCreateInput,
} from '@mms/shared';
import { getRequestTenant } from '../lib/tenantContext.js';
import {
  createSavedReportForOwner,
  deleteSavedReportByOwner,
  listSavedReportsByOwner,
  touchSavedReportRunByOwner,
} from '../db/repositories/savedReportsRepository.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant;
}

export function listSavedReports(category: GenericSavedReportCategory, createdBy: string) {
  return listSavedReportsByOwner(requireTenant(), category, createdBy);
}

export function createSavedReport(
  input: GenericSavedReportCreateInput & { createdBy: string; createdByName: string },
) {
  return createSavedReportForOwner(requireTenant(), input);
}

export function deleteSavedReport(
  id: string,
  category: GenericSavedReportCategory,
  createdBy: string,
) {
  return deleteSavedReportByOwner(requireTenant(), id, category, createdBy);
}

export function runSavedReport(
  id: string,
  category: GenericSavedReportCategory,
  createdBy: string,
) {
  return touchSavedReportRunByOwner(requireTenant(), id, category, createdBy);
}
