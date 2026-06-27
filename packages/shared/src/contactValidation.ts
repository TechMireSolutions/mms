import { z } from "zod";
import { translateApp } from "./appTranslations.js";
import type { AppTranslationKey } from "./appTranslations.js";
import type { FieldConfig, FieldDefinition } from "./contactTypes.js";
import { canViewContactField, canViewContactTab } from "./contactFieldAccess.js";

const REQUIRED_TAB_I18N: Partial<Record<string, AppTranslationKey>> = {
  phones: "contacts.form.atLeastOnePhoneRequired",
  emails: "contacts.form.atLeastOneEmailRequired",
  addresses: "contacts.form.atLeastOneAddressRequired",
  socials: "contacts.form.atLeastOneSocialRequired",
  emergency: "contacts.form.atLeastOneEmergencyContactRequired",
};

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Compiles a dynamic custom field validation schema based on custom field configuration parameters.
 *
 * @param {FieldDefinition} fieldDefinition - The custom field configuration.
 * @returns {z.ZodTypeAny} The compiled Zod validator.
 */
export function buildCustomFieldSchema(fieldDefinition: FieldDefinition): z.ZodTypeAny {
  let baseSchema: z.ZodTypeAny;

  switch (fieldDefinition.type) {
    case "text":
    case "textarea": {
      let stringSchema = z.string();
      if (fieldDefinition.minLength !== undefined) {
        stringSchema = stringSchema.min(fieldDefinition.minLength, `${fieldDefinition.label} must be at least ${fieldDefinition.minLength} characters.`);
      }
      if (fieldDefinition.maxLength !== undefined) {
        stringSchema = stringSchema.max(fieldDefinition.maxLength, `${fieldDefinition.label} must be at most ${fieldDefinition.maxLength} characters.`);
      }
      baseSchema = stringSchema;
      break;
    }
    case "number": {
      let numberSchema = z.coerce.number({
        message: `${fieldDefinition.label} must be a number.`,
      });
      if (fieldDefinition.min !== undefined) {
        numberSchema = numberSchema.min(fieldDefinition.min, `${fieldDefinition.label} must be at least ${fieldDefinition.min}.`);
      }
      if (fieldDefinition.max !== undefined) {
        numberSchema = numberSchema.max(fieldDefinition.max, `${fieldDefinition.label} must be at most ${fieldDefinition.max}.`);
      }
      baseSchema = numberSchema;
      break;
    }
    case "email": {
      baseSchema = z.string().regex(EMAIL_RE, {
        message: "isNotValidEmail",
      });
      break;
    }
    case "url": {
      baseSchema = z.string().url(`${fieldDefinition.label} is not a valid URL.`);
      break;
    }
    case "date": {
      baseSchema = z.string().refine((value) => !isNaN(Date.parse(value)), {
        message: `${fieldDefinition.label} is not a valid date.`,
      });
      break;
    }
    case "datetime": {
      baseSchema = z.string().refine((value) => !isNaN(Date.parse(value)), {
        message: `${fieldDefinition.label} is not a valid date/time.`,
      });
      break;
    }
    case "currency": {
      let currencySchema = z.string().refine((val) => {
        if (!val) return true;
        return !isNaN(Number(val));
      }, {
        message: `${fieldDefinition.label} must be a valid numeric string.`,
      });

      if (fieldDefinition.precision !== undefined) {
        currencySchema = currencySchema.refine((val) => {
          if (!val) return true;
          const decimals = val.split('.')[1] ?? '';
          return decimals.length <= fieldDefinition.precision!;
        }, {
          message: `Precision exceeded. Max allowed is ${fieldDefinition.precision} decimal places.`,
        });
      }
      baseSchema = currencySchema;
      break;
    }
    case "select":
    case "single_select": {
      if (fieldDefinition.options && fieldDefinition.options.length > 0) {
        baseSchema = z.string().refine((value) => fieldDefinition.options!.includes(value), {
          message: `${fieldDefinition.label} must be one of the allowed options.`,
        });
      } else {
        baseSchema = z.string();
      }
      break;
    }
    case "multiselect":
    case "multi_select": {
      if (fieldDefinition.options && fieldDefinition.options.length > 0) {
        baseSchema = z.array(z.string()).refine((values) => values.every(valueOption => fieldDefinition.options!.includes(valueOption)), {
          message: `${fieldDefinition.label} contains invalid options.`,
        });
      } else {
        baseSchema = z.array(z.string());
      }
      break;
    }
    case "tags": {
      baseSchema = z.union([z.array(z.string()), z.string()]);
      break;
    }
    case "boolean": {
      baseSchema = z.coerce.boolean();
      break;
    }
    case "file": {
      baseSchema = z.union([
        z.string(),
        z.object({
          name: z.string(),
          url: z.string(),
          size: z.number().optional(),
          type: z.string().optional()
        })
      ]);
      break;
    }
    case "location": {
      baseSchema = z.object({
        lat: z.number(),
        lng: z.number(),
        address: z.string().optional()
      });
      break;
    }
    case "ai_summary": {
      baseSchema = z.string().optional();
      break;
    }
    default: {
      baseSchema = z.unknown();
    }
  }

  if (fieldDefinition.required) {
    if (fieldDefinition.type === "text" || fieldDefinition.type === "textarea" || fieldDefinition.type === "email" || fieldDefinition.type === "url" || fieldDefinition.type === "date" || fieldDefinition.type === "datetime" || fieldDefinition.type === "select" || fieldDefinition.type === "single_select" || fieldDefinition.type === "currency") {
      baseSchema = baseSchema.refine((value) => typeof value === "string" && value.trim() !== "", {
        message: `${fieldDefinition.label} is required.`,
      });
    } else if (fieldDefinition.type === "multiselect" || fieldDefinition.type === "multi_select") {
      baseSchema = baseSchema.refine((value) => Array.isArray(value) && value.length > 0, {
        message: `${fieldDefinition.label} is required.`,
      });
    } else if (fieldDefinition.type === "number") {
      baseSchema = baseSchema.refine((value) => value !== null && value !== undefined && !isNaN(value as number), {
        message: `${fieldDefinition.label} is required.`,
      });
    } else if (fieldDefinition.type === "boolean") {
      baseSchema = baseSchema.refine((value) => value === true, {
        message: `${fieldDefinition.label} is required.`,
      });
    } else if (fieldDefinition.type === "tags") {
      baseSchema = baseSchema.refine((value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim() !== "";
        return false;
      }, {
        message: `${fieldDefinition.label} is required.`,
      });
    }
    return baseSchema;
  } else {
    // If not required, preprocess empty values to undefined to bypass checks
    return z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      return value;
    }, baseSchema.optional());
  }
}

/**
 * Compiles a comprehensive Zod validation schema representing dynamic contact checks.
 *
 * @param {FieldConfig} _config - The active field configuration.
 * @param {Set<string>} enabledTabIds - Set of currently enabled tabs.
 * @param {Set<string>} requiredTabIds - Set of currently required tabs.
 * @param {Record<string, FieldDefinition[]>} fields - The dictionary of tab fields.
 * @param {string} [language] - The active translation language (default: 'en').
 * @returns {z.ZodTypeAny} The compiled contact validation schema.
 */
export function buildDynamicContactSchema(
  _config: FieldConfig,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = "en",
  viewerRole?: string,
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  // Standard top-level metadata fields
  schemaObject.id = z.union([z.string(), z.number()]).optional();

  schemaObject.relationships = z.array(z.object({
    contactId: z.union([z.string(), z.number()]),
    relationship: z.string()
  })).optional().nullable();

  schemaObject.activities = z.array(z.object({
    id: z.string(),
    type: z.enum(["note", "stage_change", "whatsapp", "email", "system", "task", "call"]),
    content: z.string(),
    date: z.string(),
    by: z.string().optional()
  })).optional().nullable();

  schemaObject.attachments = z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string(),
    date: z.string()
  })).optional().nullable();

  // List Tabs (nested array properties of Contact)
  const listTabsMapping: Record<string, string> = {
    phones: "phones",
    emails: "emails",
    addresses: "addresses",
    socials: "socials",
    emergency: "emergencyContacts",
  };

  // 1. Fields for tabs that map to top-level properties of Contact (basic + custom tabs)
  Object.keys(fields).forEach((tabId) => {
    if (listTabsMapping[tabId]) return;
    if (!enabledTabIds.has(tabId) && tabId !== "basic") return;

    if (viewerRole) {
      const tabDef = _config.formTabs?.find((t) => t.key === tabId);
      if (tabDef && !canViewContactTab(viewerRole, tabDef)) {
        return;
      }
    }

    const tabFields = (fields[tabId] || []).filter((field) => field.enabled);
    tabFields.forEach((field) => {
      if (viewerRole && !canViewContactField(viewerRole, field)) {
        return;
      }
      schemaObject[field.key] = buildCustomFieldSchema(field);
    });
  });

  // 2. List Tabs (nested array properties of Contact)
  Object.entries(listTabsMapping).forEach(([tabId, propKey]) => {
    if (!enabledTabIds.has(tabId)) {
      return;
    }

    if (viewerRole) {
      const tabDef = _config.formTabs?.find((t) => t.key === tabId);
      if (tabDef && !canViewContactTab(viewerRole, tabDef)) {
        return;
      }
    }

    const tabFields = (fields[tabId] || []).filter((field) => field.enabled);
    
    const itemSchemaObject: Record<string, z.ZodTypeAny> = {};
    tabFields.forEach((field) => {
      if (viewerRole && !canViewContactField(viewerRole, field)) {
        return;
      }
      itemSchemaObject[field.key] = buildCustomFieldSchema(field);
    });
    
    const itemSchema = z.object(itemSchemaObject);
    
    let arraySchema: z.ZodTypeAny = z.array(itemSchema).optional().nullable();
    if (requiredTabIds.has(tabId)) {
      const i18nKey = REQUIRED_TAB_I18N[tabId];
      const label = i18nKey ? translateApp(i18nKey, language) : "At least one entry is required.";
      arraySchema = z.array(itemSchema).min(1, label);
    }
    schemaObject[propKey] = arraySchema;
  });

  return z.object(schemaObject).passthrough();
}

export interface ValidationError {
  fieldId: string;
  tabId: string;
  message: string;
  index?: number;
}

/**
 * Translates Zod validation errors into a human-readable list of structured error objects.
 *
 * @param {z.ZodError} error - The Zod validation error.
 * @param {unknown} data - The input data being validated.
 * @param {Record<string, FieldDefinition[]>} fields - Custom fields by tab to map top-level errors.
 * @returns {ValidationError[]} An array of validation errors.
 */
export function formatZodIssues(error: z.ZodError, data: unknown, fields: Record<string, FieldDefinition[]>): ValidationError[] {
  const errors: ValidationError[] = [];
  error.issues.forEach((issue) => {
    const path = issue.path;
    const message = issue.message;

    const listTabKeys = ["phones", "emails", "addresses", "socials", "emergencyContacts", "relationships"];
    if (listTabKeys.includes(path[0] as string) && typeof path[1] === "number") {
      const arrayName = path[0] as string;
      const index = path[1];
      const fieldId = path[2] as string;
      
      const tabIdMap: Record<string, string> = {
        phones: "phones",
        emails: "emails",
        addresses: "addresses",
        socials: "socials",
        emergencyContacts: "emergency",
        relationships: "relationships",
      };
      const prefixMap: Record<string, string> = {
        phones: "Phone",
        emails: "Email",
        addresses: "Address",
        socials: "Social Link",
        emergencyContacts: "Emergency Contact",
        relationships: "Relationship",
      };
      
      const tabId = tabIdMap[arrayName];
      const prefix = prefixMap[arrayName];
      
      errors.push({
        fieldId,
        tabId,
        message: `${prefix} #${index + 1}: ${message}`,
        index,
      });
    } else {
      const fieldId = path[0] as string;
      let tabId = "basic";
      
      for (const [tabIdKey, tabFields] of Object.entries(fields)) {
        if (tabFields.some(field => field.key === fieldId)) {
          tabId = tabIdKey;
          break;
        }
      }
      
      errors.push({ fieldId, tabId, message });
    }
  });
  return errors;
}

/**
 * Resolves the default form value for a field definition, adhering to dynamic form architecture Rule 11.
 *
 * @param {FieldDefinition} field - The field definition.
 * @returns {unknown} The resolved default/initial value.
 */
export function getDefaultFieldValue(field: FieldDefinition): unknown {
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    return field.defaultValue;
  }

  switch (field.type) {
    case "number":
    case "boolean":
    case "date":
    case "datetime":
    case "location":
    case "file":
      return null;
    case "multiselect":
    case "multi_select":
    case "tags":
      return [];
    case "text":
    case "textarea":
    case "email":
    case "url":
    case "select":
    case "single_select":
    case "currency":
    case "ai_summary":
    default:
      return "";
  }
}

/**
 * Resolves the default value for a module field definition, converting it to conform with Rule 11.
 *
 * @param {object} field - The module field definition.
 * @param {string} field.id - The field ID.
 * @param {string} field.type - The field type.
 * @param {unknown} [field.defaultValue] - Optional default value.
 * @returns {unknown} The resolved default/initial value.
 */
export function getDefaultModuleFieldValue(field: { id: string; type?: string; defaultValue?: unknown }): unknown {
  return getDefaultFieldValue({
    key: field.id,
    type: (field.type || "text") as any,
    defaultValue: field.defaultValue,
    enabled: true,
    order: 0,
    label: "",
  });
}


