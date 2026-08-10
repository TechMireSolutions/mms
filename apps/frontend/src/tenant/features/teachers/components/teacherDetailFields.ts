import {
  TEACHERS_TAB_REGISTRY,
  isTeacherLockedEnabledTab,
  listTeacherSystemFormFieldKeys,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
  type FieldDefinition,
  type TeachersSettings,
} from "@mms/shared";

export type TeacherDetailFieldRow = {
  key: string;
  label: string;
  labelKey?: FieldDefinition["labelKey"];
  type: string;
  tab: string;
  order: number;
  isCustom: boolean;
};

/**
 * Enabled Setup fields for TeacherDetail, ordered by formTabs then field order.
 * Locked `basic` always participates; other tabs follow `enabledTabs`.
 */
export function listTeacherDetailAttributeFields(
  settings: TeachersSettings,
): TeacherDetailFieldRow[] {
  const fields = resolveTeacherFieldsMapForColumnSync(settings.fields);
  const formTabs =
    settings.formTabs && settings.formTabs.length > 0
      ? settings.formTabs
      : TEACHERS_TAB_REGISTRY;
  const tabOrderMap = Object.fromEntries(
    formTabs.map((tab, index) => [tab.key, index]),
  );
  const enabledTabIds = new Set(resolveTeacherEnabledTabIds(settings));
  const systemKeys = listTeacherSystemFormFieldKeys();

  const list: TeacherDetailFieldRow[] = [];
  for (const [tabId, tabFields] of Object.entries(fields)) {
    if (!isTeacherLockedEnabledTab(tabId) && !enabledTabIds.has(tabId)) continue;
    for (const field of tabFields) {
      if (!field.enabled) continue;
      list.push({
        key: field.key,
        label: field.label,
        labelKey: field.labelKey,
        type: field.type,
        tab: tabId,
        order: field.order ?? 0,
        isCustom: !systemKeys.has(field.key),
      });
    }
  }

  return list.sort((left, right) => {
    const leftTab = tabOrderMap[left.tab] ?? 9999;
    const rightTab = tabOrderMap[right.tab] ?? 9999;
    if (leftTab !== rightTab) return leftTab - rightTab;
    return left.order - right.order;
  });
}
