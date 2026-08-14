import type { TabDefinition } from "./contactTypes.js";
import type { ModuleCustomField, ModuleFieldDef } from "./moduleFieldSchema.js";
import { INITIAL_USERS_FIELD_SEED } from "./moduleFieldSetupPersons.js";

// ─── Users Module Settings ───────────────────────────────────────────────────

export interface UsersSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, unknown>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  /** Persisted workspace roles (system + custom); falls back to `DEFAULT_WORKSPACE_ROLES`. */
  workspaceRoles?: import("./userTypes.js").WorkspaceRole[];
}

export const DEFAULT_USERS_SETTINGS: UsersSettings = {
  allowSelfRegistration: false,
  requireEmailVerification: true,
  defaultViewLayout: "list",
  fields: {
    basic: INITIAL_USERS_FIELD_SEED.basic.map((f) => ({ ...f })),
    security: INITIAL_USERS_FIELD_SEED.security.map((f) => ({ ...f })),
  },
  customFields: [],
  fieldOrder: ["name", "email", "roles"],
};

export const DEFAULT_USERS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Full Name", required: true },
  { id: "email", label: "Email Address", required: true },
  { id: "role", label: "System Role", required: true },
];
