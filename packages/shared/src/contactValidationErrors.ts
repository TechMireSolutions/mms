import { z } from "zod";
import type { FieldDefinition } from "./contactTypes.js";

const LIST_TAB_TO_TAB_ID: Record<string, string> = {
  phones: "phones",
  emails: "emails",
  addresses: "addresses",
  socials: "socials",
  relationshipContacts: "relationship",
  relationships: "relationships",
};

const LIST_TAB_PREFIX_MAP: Record<string, string> = {
  phones: "Phone",
  emails: "Email",
  addresses: "Address",
  socials: "Social Link",
  relationshipContacts: "Relationship",
  relationships: "Relationship",
};

/** Structured contact validation issue mapped to its field and form tab. */
export interface ValidationError {
  fieldId: string;
  tabId: string;
  message: string;
  index?: number;
}

/** Maps Zod issues to contact form fields and tabs. */
export function formatZodIssues(
  error: z.ZodError,
  submittedValue: unknown,
  fields: Record<string, FieldDefinition[]>,
): ValidationError[] {
  void submittedValue;
  return error.issues.map((issue) => {
    const [pathRoot, pathIndex, pathField] = issue.path;
    if (
      typeof pathRoot === "string" &&
      LIST_TAB_TO_TAB_ID[pathRoot] &&
      typeof pathIndex === "number"
    ) {
      return {
        fieldId: pathField as string,
        tabId: LIST_TAB_TO_TAB_ID[pathRoot] ?? pathRoot,
        message: `${LIST_TAB_PREFIX_MAP[pathRoot] ?? "Item"} #${pathIndex + 1}: ${issue.message}`,
        index: pathIndex,
      };
    }

    const fieldId = pathRoot as string;
    const tabId = Object.entries(fields).find(([, tabFields]) =>
      tabFields.some((field) => field.key === fieldId)
    )?.[0] ?? "basic";
    return { fieldId, tabId, message: issue.message };
  });
}
