import { useMemo } from 'react';
import { canViewContactField, canEditContactField, type FieldDefinition } from '@mms/shared';
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useSortedFields } from '@/hooks/useSortedFields';

/** Registry fields visible to the current user (enabled + field permissions). */
export function useVisibleContactFields(tabId: string): FieldDefinition[] {
  const sorted = useSortedFields(tabId);
  const { isTabFieldEnabled } = useContactConfig();
  const { role } = usePermissions();
  const viewerRole = role ?? '';

  return useMemo(
    () =>
      sorted.filter(
        (field) => isTabFieldEnabled(tabId, field.key) && canViewContactField(viewerRole, field),
      ),
    [sorted, tabId, isTabFieldEnabled, viewerRole],
  );
}

export function useCanEditContactField(tabId: string, fieldKey: string): boolean {
  const { fields, isTabFieldEnabled } = useContactConfig();
  const { role } = usePermissions();
  const viewerRole = role ?? '';
  const field = fields[tabId]?.find((f) => f.key === fieldKey);
  if (!field || !isTabFieldEnabled(tabId, fieldKey)) return false;
  return canEditContactField(viewerRole, field);
}

/** True when the tab has at least one field visible to the current user. */
export function useCanViewContactTab(tabId: string): boolean {
  return useVisibleContactFields(tabId).length > 0;
}

/** Field keys the viewer can see but not edit (for disabled inputs). */
export function useReadOnlyContactFieldKeys(tabId: string): string[] {
  const visible = useVisibleContactFields(tabId);
  const { role } = usePermissions();
  const viewerRole = role ?? '';

  return useMemo(
    () => visible.filter((field) => !canEditContactField(viewerRole, field)).map((field) => field.key),
    [visible, viewerRole],
  );
}
