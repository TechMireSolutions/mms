import { z } from "zod";
import { translateApp } from "./appTranslations.js";
import type { AppTranslationKey } from "./appTranslations.js";
import type { FieldDefinition } from "./contactTypes.js";
import type { StudentsSettings } from "./settingsTypes.js";
import { buildCustomFieldSchema, type ValidationError } from "./contactValidation.js";
import { canViewContactTab, canViewContactField } from "./contactFieldAccess.js";


const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;


/**
 * Compiles a comprehensive Zod validation schema representing dynamic student checks.
 */
export function buildDynamicStudentSchema(
  settings: StudentsSettings,
  enabledTabIds: Set<string>,
  requiredTabIds: Set<string>,
  fields: Record<string, FieldDefinition[]>,
  language = "en",
  viewerRole?: string,
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

    if (viewerRole) {
      const tabDef = settings.formTabs?.find((t) => t.key === tabId);
      if (tabDef && !canViewContactTab(viewerRole, tabDef)) {
        return;
      }
    }

    const tabFields = (fields[tabId] || []).filter((f) => f.enabled);
    tabFields.forEach((field) => {
      if (viewerRole && !canViewContactField(viewerRole, field)) {
        return;
      }
      // Map logic link fields to their model properties
      if (field.key === "fatherLink" || field.key === "motherLink" || field.key === "guardianLink") {
        const label = field.key === "fatherLink" ? "Father Link" : field.key === "motherLink" ? "Mother Link" : "Guardian Link";
        const targetKey = field.key === "fatherLink" ? "fatherContactId" : field.key === "motherLink" ? "motherContactId" : "guardianContactId";
        
        const linkSchema = z.union([z.string(), z.number()], {
          error: `${label} must be a valid contact.`,
        });
        
        if (field.required) {
          schemaObject[targetKey] = linkSchema;
        } else {
          schemaObject[targetKey] = z.preprocess((val) => {
            if (val === "" || val === null || val === undefined) {
              return undefined;
            }
            return val;
          }, linkSchema.optional());
        }
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

/**
 * Translates Zod validation errors into a human-readable list of structured error objects.
 */
export function formatStudentZodIssues(
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
