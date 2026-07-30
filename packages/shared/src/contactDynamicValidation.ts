import { z } from "zod";
import { translateApp, type AppTranslationKey } from "./appTranslations.js";
import { canViewContactField, canViewContactTab } from "./contactFieldAccess.js";
import { buildCustomFieldSchema } from "./contactFieldValidation.js";
import type { FieldConfig, FieldDefinition } from "./contactTypes.js";

const REQUIRED_TAB_I18N: Partial<Record<string, AppTranslationKey>> = {
  phones: "contacts.form.atLeastOnePhoneRequired",
  emails: "contacts.form.atLeastOneEmailRequired",
  addresses: "contacts.form.atLeastOneAddressRequired",
  socials: "contacts.form.atLeastOneSocialRequired",
  emergency: "contacts.form.atLeastOneEmergencyContactRequired",
};

const LIST_TABS_PROP_MAP: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  emergency: "emergencyContacts",
};

/** Compiles the active contact field configuration into a Zod object schema. */
export function buildDynamicContactSchema(
  config: FieldConfig,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = "en",
  viewerRole?: string,
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {
    id: z.union([z.string(), z.number()]).optional(),
    relationships: z.array(z.object({
      contactId: z.union([z.string(), z.number()]),
      relationship: z.string(),
    })).optional().nullable(),
    activities: z.array(z.object({
      id: z.string(),
      type: z.enum(["note", "stage_change", "whatsapp", "email", "system", "task", "call"]),
      content: z.string(),
      date: z.string(),
      by: z.string().optional(),
    })).optional().nullable(),
    attachments: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      size: z.number(),
      url: z.string(),
      date: z.string(),
    })).optional().nullable(),
  };

  for (const [tabId, configuredFields] of Object.entries(fields)) {
    if (LIST_TABS_PROP_MAP[tabId]) continue;
    if (!enabledTabIds.has(tabId) && tabId !== "basic") continue;

    const tabDefinition = config.formTabs?.find((tab) => tab.key === tabId);
    if (viewerRole && tabDefinition && !canViewContactTab(viewerRole, tabDefinition)) {
      continue;
    }

    for (const field of configuredFields) {
      if (!field.enabled || (viewerRole && !canViewContactField(viewerRole, field))) {
        continue;
      }
      schemaObject[field.key] = buildCustomFieldSchema(field);
    }
  }

  for (const [tabId, propertyKey] of Object.entries(LIST_TABS_PROP_MAP)) {
    if (!enabledTabIds.has(tabId)) continue;

    const tabDefinition = config.formTabs?.find((tab) => tab.key === tabId);
    if (viewerRole && tabDefinition && !canViewContactTab(viewerRole, tabDefinition)) {
      continue;
    }

    const itemSchemaObject: Record<string, z.ZodTypeAny> = {};
    for (const field of fields[tabId] ?? []) {
      if (!field.enabled || (viewerRole && !canViewContactField(viewerRole, field))) {
        continue;
      }
      itemSchemaObject[field.key] = buildCustomFieldSchema(field);
    }

    const itemSchema = z.object(itemSchemaObject);
    if (requiredTabIds.has(tabId)) {
      const translationKey = REQUIRED_TAB_I18N[tabId];
      const message = translationKey
        ? translateApp(translationKey, language)
        : "At least one entry is required.";
      schemaObject[propertyKey] = z.array(itemSchema).min(1, message);
    } else {
      schemaObject[propertyKey] = z.array(itemSchema).optional().nullable();
    }
  }

  return z.object(schemaObject).passthrough();
}
