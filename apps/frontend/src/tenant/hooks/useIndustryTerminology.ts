/**
 * @file useIndustryTerminology.ts
 * @description Resolves industry terminology profile for UI labels (no DB renames).
 */

import { getTerminologyForIndustry, type TerminologyProfile } from '@mms/shared';
import { getCurrentSubdomain } from '@/lib/config/tenantConfig';
import { useWorkspaceBySubdomain } from '@/tenant/hooks/useWorkspaceBySubdomain';

export function useIndustryTerminology(): TerminologyProfile {
  const subdomain = getCurrentSubdomain();
  const { data } = useWorkspaceBySubdomain(subdomain, Boolean(subdomain));
  const industryType = data?.body?.workspace
    ? (data.body.workspace as { industryType?: string }).industryType
    : undefined;
  return getTerminologyForIndustry(industryType);
}
