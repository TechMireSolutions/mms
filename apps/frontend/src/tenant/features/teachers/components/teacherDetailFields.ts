import {
  TEACHERS_TAB_REGISTRY,
  collectActiveDfsFields,
  isTeacherLockedEnabledTab,
  listTeacherSystemFormFieldKeys,
  resolveTeacherEnabledTabIds,
  resolveTeacherFieldsMapForColumnSync,
  type FieldDefinition,
  type TabConfig,
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
 * DFS custom fields (from `dfsTabs`) are appended deduped by key.
 */
export function listTeacherDetailAttributeFields(
  settings: TeachersSettings,
  dfsTabs?: TabConfig[],
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

  // Append DFS fields (deduped by key) using the shared collector.
  if (dfsTabs && dfsTabs.length > 0) {
    const { fields: dfsFields, tabByFieldKey } = collectActiveDfsFields(dfsTabs);
    for (const field of dfsFields) {
      if (list.some((existing) => existing.key === field.key)) continue;
      const dfsTabKey = tabByFieldKey.get(field.key) ?? "";
      const dfsTabLabel = dfsTabs?.find((t) => t.key === dfsTabKey)?.label;
      list.push({
        key: field.key,
        label: field.label,
        type: field.type,
        tab: dfsTabKey,
        order: (field as { sortOrder?: number }).sortOrder ?? 999,
        isCustom: true,
      });
      void dfsTabLabel; // group label resolved downstream via tab lookup
    }
  }

  return list.sort((left, right) => {
    const leftTab = tabOrderMap[left.tab] ?? 9999;
    const rightTab = tabOrderMap[right.tab] ?? 9999;
    if (leftTab !== rightTab) return leftTab - rightTab;
    return left.order - right.order;
  });
}
