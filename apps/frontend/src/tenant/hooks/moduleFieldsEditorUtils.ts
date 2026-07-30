import { type FieldDefinition } from "@mms/shared";
import type { FieldDerivedState } from "./moduleFieldsEditorTypes";

export function syncOrder(prevOrder: string[], newFieldIds: string[]): string[] {
  const kept = prevOrder.filter((id) => newFieldIds.includes(id));
  const added = newFieldIds.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

/** Guarantees an array type, preventing crashes from malformed API objects. */
export const safeArray = <T>(arr: unknown): T[] => (Array.isArray(arr) ? arr : []);

export function buildFieldDerivedState(
  fields: Record<string, FieldDefinition[]>,
): FieldDerivedState {
  return {
    tabFieldEnabled: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.enabled).map((field) => field.key)),
      ]),
    ),
    tabFieldRequired: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.required).map((field) => field.key)),
      ]),
    ),
    tabFieldUnique: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        new Set(safeArray<FieldDefinition>(list).filter((field) => field.unique).map((field) => field.key)),
      ]),
    ),
    tabFieldDefaultValues: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        Object.fromEntries(
          safeArray<FieldDefinition>(list)
            .filter((field) => field.defaultValue !== undefined)
            .map((field) => [field.key, field.defaultValue]),
        ),
      ]),
    ),
    tabFieldPermissions: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        Object.fromEntries(
          safeArray<FieldDefinition>(list)
            .filter((field) => field.permissions)
            .map((field) => [field.key, field.permissions as string[]]),
        ),
      ]),
    ),
    tabFieldOrder: Object.fromEntries(
      Object.entries(fields).map(([tabId, list]) => [
        tabId,
        safeArray<FieldDefinition>(list).map((field) => field.key),
      ]),
    ),
  };
}
