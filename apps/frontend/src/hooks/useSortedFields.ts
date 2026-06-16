import { useMemo } from "react";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { FieldDefinition } from "@mms/shared";

/**
 * Hook to retrieve all field definitions for a specific tab
 * sorted by their order property.
 *
 * @param {string} tabId - The ID of the tab to get fields for.
 * @returns {FieldDefinition[]} The sorted field definitions list.
 */
export function useSortedFields(tabId: string): FieldDefinition[] {
  const { fields } = useContactConfig();

  return useMemo(() => {
    const tabFields = fields[tabId] || [];
    return [...tabFields].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
  }, [tabId, fields]);
}
