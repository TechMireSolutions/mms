import { createContext } from "react";
import type { FieldConfig } from "@mms/shared";
import type { ContactConfigExtras } from "./useContactConfigTypes";

/** Column descriptor for Contacts tables and grid views. */
export interface ContactsColumnConfig {
  id: string;
  label: string;
  sortField?: string;
  width?: number;
}

/** Complete Contact Configuration Context shape consumed by tenant views and forms. */
export interface ContactConfigContextType
  extends Omit<ContactConfigExtras, "lookupsReady" | "reloadCollections"> {
  fieldConfig: FieldConfig;
  defaultPhoneCountryCode: string;
}

/** React Context instance for Contacts module configuration. */
export const ContactConfigContext = createContext<ContactConfigContextType | null>(null);


