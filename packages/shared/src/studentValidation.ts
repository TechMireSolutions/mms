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

  const contactRequiredMsg = translateApp("students.form.contactRequired" as AppTranslationKey, language);
  schemaObject.contactId = z.union([z.string(), z.number()], {
    error: contactRequiredMsg,
  }).refine((contactIdValue) => contactIdValue !== null && contactIdValue !== undefined && contactIdValue !== "", {
    message: contactRequiredMsg,
  });

  const grRequiredMsg = translateApp("students.form.grNumberRequired" as AppTranslationKey, language);
  schemaObject.grNumber = z.string({ message: grRequiredMsg }).min(1, grRequiredMsg);

  const statusRequiredMsg = translateApp("students.form.statusRequired" as AppTranslationKey, language);
  schemaObject.status = z.string().min(1, statusRequiredMsg);

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
        const labelKey =
          field.key === "fatherLink"
            ? "students.form.fatherLink"
            : field.key === "motherLink"
              ? "students.form.motherLink"
              : "students.form.guardianLink";
        const label = translateApp(labelKey as AppTranslationKey, language);
        const targetKey = field.key === "fatherLink" ? "fatherContactId" : field.key === "motherLink" ? "motherContactId" : "guardianContactId";
        const linkInvalidMsg = translateApp("students.form.linkContactInvalid" as AppTranslationKey, language).replace(
          "{label}",
          label,
        );

        const linkSchema = z.union([z.string(), z.number()], {
          error: linkInvalidMsg,
        });

        if (field.required) {
          schemaObject[targetKey] = linkSchema;
        } else {
          schemaObject[targetKey] = z.preprocess((contactIdValue) => {
            if (contactIdValue === "" || contactIdValue === null || contactIdValue === undefined) {
              return undefined;
            }
            return contactIdValue;
          }, linkSchema.optional());
        }
      } else {
        schemaObject[field.key] = buildCustomFieldSchema(field);
      }
    });
  });

  let baseSchema = z.object(schemaObject).passthrough();

  if (settings.requireGuardian) {
    baseSchema = baseSchema.refine((studentDraft: Record<string, unknown>) => {
      return Boolean(studentDraft.fatherContactId || studentDraft.motherContactId || studentDraft.guardianContactId);
    }, {
      message: translateApp("students.form.guardianRequired" as AppTranslationKey, language),
      path: ["guardianContactId"],
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
      if (tabFields.some((f) => f.key === mappedFieldId || f.key === fieldId)) {
        tabId = tId;
        break;
      }
    }

    // FormModal has Identity (`basic`) + Registration (`registration`) only.
    const registrationFieldIds = new Set(["grNumber", "status", "registeredDate", "notes"]);
    if (registrationFieldIds.has(mappedFieldId) || tabId === "academic" || tabId === "registration") {
      tabId = "registration";
    } else {
      tabId = "basic";
    }

    errors.push({ fieldId: mappedFieldId, tabId, message });
  });
  return errors;
}
