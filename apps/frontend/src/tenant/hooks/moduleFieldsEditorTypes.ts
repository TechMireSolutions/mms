import { type FieldDefinition, type TabDefinition } from "@mms/shared";

export interface UseFieldsEditorProps {
  initialTabs: TabDefinition[];
  initialFields: Record<string, FieldDefinition[]>;
  initialEnabledTabs: string[];
  initialRequiredTabs: string[];
}

export interface FieldDerivedState {
  tabFieldEnabled: Record<string, Set<string>>;
  tabFieldRequired: Record<string, Set<string>>;
  tabFieldUnique: Record<string, Set<string>>;
  tabFieldDefaultValues: Record<string, Record<string, unknown>>;
  tabFieldPermissions: Record<string, Record<string, string[]>>;
  tabFieldOrder: Record<string, string[]>;
}
