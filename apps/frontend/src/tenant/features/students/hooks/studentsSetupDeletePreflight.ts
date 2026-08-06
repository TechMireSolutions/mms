import {
  type FieldDefinition,
  type StudentsSettings,
  DEFAULT_STUDENT_COLUMN_REGISTRY,
  getStudentFieldRemovalIssues,
  syncStudentColumnRegistryWithFields,
} from "@mms/shared";

export type StudentsFieldsDraftSnapshot = {
  buildFieldsMap: () => Record<string, FieldDefinition[]>;
  enabledTabs: Iterable<string>;
};

export type StudentsSetupDeleteNotify = (
  messageKey: string,
  params?: { count: number },
) => void;

type PrefightContext = {
  settings: StudentsSettings;
  fieldsDraft: StudentsFieldsDraftSnapshot;
  onBlocked: StudentsSetupDeleteNotify;
};

/**
 * Dependency checks before removing a Students Setup field.
 * Blocks system seeds and fields still enabled in the Work column registry.
 * (No live usage API yet — unlike Contacts.)
 */
export function preflightStudentFieldDelete(
  fieldId: string,
  context: PrefightContext,
): boolean {
  const draftFields = context.fieldsDraft.buildFieldsMap() || {};
  const draftColumnRegistry = syncStudentColumnRegistryWithFields(
    context.settings.columnRegistry || DEFAULT_STUDENT_COLUMN_REGISTRY,
    draftFields,
    context.fieldsDraft.enabledTabs,
  );

  const issues = getStudentFieldRemovalIssues({
    fieldKey: fieldId,
    columnRegistry: draftColumnRegistry,
  });
  if (issues.length === 0) return true;

  const issue = issues[0];
  context.onBlocked(
    issue.messageKey,
    issue.count !== undefined ? { count: issue.count } : undefined,
  );
  return false;
}

/** Runs {@link preflightStudentFieldDelete} for each field; stops on first blocker. */
export function preflightStudentFieldsDelete(
  fieldIds: string[],
  context: PrefightContext,
): boolean {
  for (const fieldId of fieldIds) {
    if (!preflightStudentFieldDelete(fieldId, context)) return false;
  }
  return true;
}
