import { z } from "zod";
import {
  translateApp,
  type AppTranslationKey,
  type FieldDefinition,
  type StudentsSettings,
} from "@mms/shared";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/**
 * Compiles a dynamic custom field validation schema based on custom field configuration parameters.
 *
 * @param {FieldDefinition} cf - The custom field configuration.
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
    return z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) {
        return undefined;
      }
      return val;
    }, baseSchema.optional());
  }
}

/**
 * Compiles a comprehensive Zod validation schema representing dynamic student checks.
 */
export function buildDynamicStudentSchema(
  settings: StudentsSettings,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = "en",
): z.ZodTypeAny {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  schemaObject.contactId = z.union([z.string(), z.number()], {
    error: translateApp("students.form.contactRequired" as AppTranslationKey, language) || "Contact is required.",
  }).refine(val => val !== null && val !== undefined && val !== "", {
    message: translateApp("students.form.contactRequired" as AppTranslationKey, language) || "Contact is required.",
  });

  schemaObject.grNumber = z.string({
    message: "GR Number is required.",
  }).min(1, "GR Number is required.");

  schemaObject.status = z.string().min(1, "Status is required.");

  // Process dynamic tab fields
  Object.keys(fields).forEach((tabId) => {
    if (!enabledTabIds.has(tabId) && tabId !== "basic") return;

    const tabFields = (fields[tabId] || []).filter((f) => f.enabled);
    tabFields.forEach((field) => {
      // Map logic link fields to their model properties
      if (field.key === "fatherLink") {
        schemaObject.fatherContactId = buildCustomFieldSchema({ ...field, label: "Father Link" });
      } else if (field.key === "motherLink") {
        schemaObject.motherContactId = buildCustomFieldSchema({ ...field, label: "Mother Link" });
      } else if (field.key === "guardianLink") {
        schemaObject.guardianContactId = buildCustomFieldSchema({ ...field, label: "Guardian Link" });
      } else {
        schemaObject[field.key] = buildCustomFieldSchema(field);
      }
    });
  });

  let baseSchema = z.object(schemaObject).passthrough();

  if (settings.requireGuardian) {
    baseSchema = baseSchema.refine((data: any) => {
      return data.fatherContactId || data.motherContactId || data.guardianContactId;
    }, {
      message: translateApp("students.form.guardianRequired" as AppTranslationKey, language) || "At least one guardian (father, mother, or other guardian) must be linked.",
      path: ["guardianContactId"], // Highlight guardian select if missing
    });
  }

  return baseSchema;
}

export interface ValidationError {
  fieldId: string;
  tabId: string;
  message: string;
}

/**
 * Translates Zod validation errors into a human-readable list of structured error objects.
 */
export function formatZodIssues(
  error: z.ZodError,
  _data: unknown,
  fields: Record<string, FieldDefinition[]>,
): ValidationError[] {
  const errors: ValidationError[] = [];
  error.issues.forEach((issue) => {
    const path = issue.path;
    const message = issue.message;
    const fieldId = path[0] as string;

    let mappedFieldId = fieldId;
    let tabId = "basic";

    if (fieldId === "fatherContactId") mappedFieldId = "fatherLink";
    if (fieldId === "motherContactId") mappedFieldId = "motherLink";
    if (fieldId === "guardianContactId") mappedFieldId = "guardianLink";

    for (const [tId, tabFields] of Object.entries(fields)) {
      if (tabFields.some((f) => f.key === mappedFieldId)) {
        tabId = tId;
        break;
      }
    }

    errors.push({ fieldId: mappedFieldId, tabId, message });
  });
  return errors;
}
