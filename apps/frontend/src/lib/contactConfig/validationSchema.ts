import { z } from "zod";
import {
  DEFAULT_UI_STRINGS,
  type FieldConfig,
  type FieldDefinition,
} from "@mms/shared";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function isTabFieldRequired(config: FieldConfig, tabId: string, fieldId: string): boolean {
  const field = (config.fields?.[tabId] || []).find((f) => f.key === fieldId);
  return field?.required ?? false;
}

/**
 * Compiles a dynamic custom field validation schema based on custom field configuration parameters.
 *
 * @param {CustomField} cf - The custom field configuration.
 * @returns {z.ZodTypeAny} The compiled Zod validator.
 */
export function buildCustomFieldSchema(cf: FieldDefinition): z.ZodTypeAny {
  let baseSchema: z.ZodTypeAny;

  switch (cf.type) {
    case "text":
    case "textarea": {
      let s = z.string();
      if (cf.minLength !== undefined) {
        s = s.min(cf.minLength, `${cf.label} must be at least ${cf.minLength} characters.`);
      }
      if (cf.maxLength !== undefined) {
        s = s.max(cf.maxLength, `${cf.label} must be at most ${cf.maxLength} characters.`);
      }
      baseSchema = s;
      break;
    }
    case "number": {
      let n = z.coerce.number({
        message: `${cf.label} must be a number.`,
      });
      if (cf.min !== undefined) {
        n = n.min(cf.min, `${cf.label} must be at least ${cf.min}.`);
      }
      if (cf.max !== undefined) {
        n = n.max(cf.max, `${cf.label} must be at most ${cf.max}.`);
      }
      baseSchema = n;
      break;
    }
    case "email": {
      baseSchema = z.string().regex(EMAIL_RE, {
        message: "isNotValidEmail",
      });
      break;
    }
    case "url": {
      baseSchema = z.string().url(`${cf.label} is not a valid URL.`);
      break;
    }
    case "date": {
      baseSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: `${cf.label} is not a valid date.`,
      });
      break;
    }
    case "select": {
      if (cf.options && cf.options.length > 0) {
        baseSchema = z.string().refine((val) => cf.options!.includes(val), {
          message: `${cf.label} must be one of the allowed options.`,
        });
      } else {
        baseSchema = z.string();
      }
      break;
    }
    case "multiselect": {
      if (cf.options && cf.options.length > 0) {
        baseSchema = z.array(z.string()).refine((vals) => vals.every(v => cf.options!.includes(v)), {
          message: `${cf.label} contains invalid options.`,
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

  if (cf.required) {
    if (cf.type === "text" || cf.type === "textarea" || cf.type === "email" || cf.type === "url" || cf.type === "date" || cf.type === "select") {
      baseSchema = baseSchema.refine((val) => typeof val === "string" && val.trim() !== "", {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "multiselect") {
      baseSchema = baseSchema.refine((val) => Array.isArray(val) && val.length > 0, {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "number") {
      baseSchema = baseSchema.refine((val) => val !== null && val !== undefined && !isNaN(val as number), {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "boolean") {
      baseSchema = baseSchema.refine((val) => val === true, {
        message: `${cf.label} is required.`,
      });
    } else if (cf.type === "tags") {
      baseSchema = baseSchema.refine((val) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "string") return val.trim() !== "";
        return false;
      }, {
        message: `${cf.label} is required.`,
      });
    }
    return baseSchema;
  } else {
    // If not required, preprocess empty values to undefined to bypass checks
    return z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) {
        return undefined;
      }
      return val;
    }, baseSchema.optional());
  }
}

/**
 * Compiles a comprehensive Zod validation schema representing dynamic contact checks.
 *
 * @param {FieldConfig} config - The active field configuration.
 * @param {Set<string>} enabledTabIds - Set of currently enabled tabs.
 * @param {Set<string>} requiredTabIds - Set of currently required tabs.
 * @returns {z.ZodTypeAny} The compiled contact validation schema.
 */
export function buildDynamicContactSchema(
  config: FieldConfig,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  // Standard top-level metadata fields
  schemaObject.id = z.union([z.string(), z.number()]).optional();

  schemaObject.relationships = z.array(z.object({
    contactId: z.union([z.string(), z.number()]),
    type: z.string()
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

  // 1. Basic Fields on 'basic' tab (top-level properties of Contact)
  const basicFields = (fields.basic || []).filter((f) => f.enabled);
  basicFields.forEach((field) => {
    schemaObject[field.key] = buildCustomFieldSchema(field);
  });

  // 2. List Tabs (nested array properties of Contact)
  const listTabsMapping: Record<string, string> = {
    phones: "phones",
    emails: "emails",
    addresses: "addresses",
    socials: "socials",
    emergency: "emergencyContacts",
  };

  const uiStrings = {
    ...DEFAULT_UI_STRINGS,
    ...(config.uiStrings || {}),
  };

  Object.entries(listTabsMapping).forEach(([tabId, propKey]) => {
    if (!enabledTabIds.has(tabId)) {
      return;
    }
    const tabFields = (fields[tabId] || []).filter((f) => f.enabled);
    
    // Build Zod object schema for the items in the list dynamically
    const itemSchemaObject: Record<string, z.ZodTypeAny> = {};
    tabFields.forEach((field) => {
      itemSchemaObject[field.key] = buildCustomFieldSchema(field);
    });
    
    const itemSchema = z.object(itemSchemaObject);
    
    let arraySchema: z.ZodTypeAny = z.array(itemSchema).optional().nullable();
    if (requiredTabIds.has(tabId)) {
      const label = uiStrings[`atLeastOne${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Required`] || `At least one entry is required.`;
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
}

/**
 * Translates Zod validation errors into a human-readable list of structured error objects.
 *
 * @param {z.ZodError} error - The Zod validation error.
 * @param {unknown} data - The input data being validated.
 * @param {Record<string, CustomField[]>} tabCustomFields - Custom fields by tab to map top-level errors.
 * @returns {ValidationError[]} An array of validation errors.
 */
export function formatZodIssues(error: z.ZodError, data: unknown, fields: Record<string, FieldDefinition[]>): ValidationError[] {
  const errors: ValidationError[] = [];
  error.issues.forEach((issue) => {
    const path = issue.path;
    const message = issue.message;

    const listTabKeys = ["phones", "emails", "addresses", "socials", "emergencyContacts"];
    if (listTabKeys.includes(path[0] as string) && typeof path[1] === "number") {
      const arrayName = path[0] as string;
      const idx = path[1];
      const fieldId = path[2] as string;
      
      const tabIdMap: Record<string, string> = {
        phones: "phones",
        emails: "emails",
        addresses: "addresses",
        socials: "socials",
        emergencyContacts: "emergency",
      };
      const prefixMap: Record<string, string> = {
        phones: "Phone",
        emails: "Email",
        addresses: "Address",
        socials: "Social Link",
        emergencyContacts: "Emergency Contact",
      };
      
      const tabId = tabIdMap[arrayName];
      const prefix = prefixMap[arrayName];
      
      errors.push({
        fieldId,
        tabId,
        message: `${prefix} #${idx + 1}: ${message}`,
      });
    } else {
      const fieldId = path[0] as string;
      let tabId = "basic";
      
      for (const [tId, tabFields] of Object.entries(fields)) {
        if (tabFields.some(f => f.key === fieldId)) {
          tabId = tId;
          break;
        }
      }
      
      errors.push({ fieldId, tabId, message });
    }
  });
  return errors;
}
