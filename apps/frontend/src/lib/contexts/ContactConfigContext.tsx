/**
 * ContactConfigContext
 * Broadcasts contact field configuration and preferences via TanStack Query + REST
 * (`/api/contacts/field-config`, preferences, lookups, column-prefs).
 * Mount once under TenantScopedProviders — never nest on child pages.
 *
 * The provider delegates the shared settings slice to `createStandardModuleConfigHook`
 * (same skeleton as Teachers/Students/Sessions/Users/Enrollments) and layers the
 * Contacts-specific lookups / column-layout / tab-fields / prefs on top.
 *
 * Usage:
 *   const { fieldConfig, prefs, updateConfig, updatePrefs } = useContactConfig();
 *   const columns = useContactColumns();         // dynamic table columns
 *   const schema  = useContactValidation();     // dynamic Zod-like validation
 */
import React, { ReactNode, useContext } from "react";
import {
  ContactConfigContext,
  type ContactConfigContextType,
  type ContactsColumnConfig,
} from "@/lib/contacts/contactConfigContextTypes";
import { useContactConfigProviderValue } from "@/lib/contacts/useContactConfigProviderValue";
import { useContactsConfig } from "@/lib/contacts/useContactStandardConfig";

export { ContactConfigContext };
export type { ContactConfigContextType, ContactsColumnConfig };

/**
 * Context Provider that loads contact configuration from typed Contacts Setup REST
 * (Query-backed). Invalidation refreshes consumers — not a localStorage / live DB cache.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Child elements.
 * @returns {React.JSX.Element}
 */
export function ContactConfigProvider({ children }: { children: ReactNode }) {
  const config = useContactsConfig();

  const value: ContactConfigContextType = useContactConfigProviderValue(config);

  return (
    <ContactConfigContext value={value}>
      {children}
    </ContactConfigContext>
  );
}

/**
 * Hook to consume the ContactConfigContext.
 *
 * @returns {ContactConfigContextType} The configuration context value.
 */
export function useContactConfig(): ContactConfigContextType {
  const contactConfig = useContext(ContactConfigContext);
  if (!contactConfig) {
    throw new Error("useContactConfig must be used inside <ContactConfigProvider>");
  }
  return contactConfig;
}

// ── Dynamic column builder hook ───────────────────────────────────────────────
/**
 * Returns the ordered list of table columns that should be visible,
 * derived entirely from the current fieldConfig.
 *
 * @returns {ContactsColumnConfig[]} The array of active column descriptors.
 */
export function useContactColumns(): ContactsColumnConfig[] {
  return useContactConfig().visibleColumns;
}

