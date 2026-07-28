import { useCallback, useMemo } from "react";
import {
  FieldConfig,
  FieldDefinition,
  translateApp,
  ColumnRegistryEntry,
  DEFAULT_COLUMN_REGISTRY,
  COLUMN_FIELD_MAPPING,
  canViewContactColumn,
  applyModuleColumnOverlay,
  type ContactColumnPreference,
} from "@mms/shared";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";

export function useContactColumnRegistry({
  fieldConfig,
  fields,
  enabledTabIds,
  isTabFieldEnabled,
  rawUserColumnOverlay,
  viewerRole,
  updateUserColumnLayout,
}: {
  fieldConfig: FieldConfig;
  fields: Record<string, FieldDefinition[]>;
  enabledTabIds: Set<string>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  rawUserColumnOverlay: ContactColumnPreference[] | null;
  viewerRole: string;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
}) {
  const settings = useGlobalSettings();

  const tenantColumnRegistry = useMemo(() => {
    const baseRegistryMap = new Map<string, ColumnRegistryEntry>();
    DEFAULT_COLUMN_REGISTRY.forEach((defaultCol) => {
      const stored = (fieldConfig.columnRegistry || []).find((c) => c.key === defaultCol.key);
      baseRegistryMap.set(defaultCol.key, {
        ...defaultCol,
        order: stored?.order ?? defaultCol.order,
        sortField: stored?.sortField || defaultCol.sortField,
        enabled: defaultCol.enabled,
      });
    });

    (fieldConfig.columnRegistry || []).forEach((storedCol) => {
      if (!baseRegistryMap.has(storedCol.key)) {
        baseRegistryMap.set(storedCol.key, { ...storedCol });
      }
    });

    const registry = Array.from(baseRegistryMap.values()).sort((a, b) => a.order - b.order);

    const activeFields: Array<{ tabId: string; field: FieldDefinition }> = [];
    Object.entries(fields).forEach(([tabId, tabFields]) => {
      const tabEnabled = tabId === "basic" || enabledTabIds.has(tabId);
      if (tabEnabled) {
        (tabFields || []).forEach((fieldDefinition) => {
          if (fieldDefinition.enabled) {
            activeFields.push({ tabId, field: fieldDefinition });
          }
        });
      }
    });

    const filteredRegistry = registry.filter((column) => {
      const mapping = COLUMN_FIELD_MAPPING[column.key];
      if (mapping) {
        const tabActive = mapping.tabId === "basic" || enabledTabIds.has(mapping.tabId);
        return tabActive && isTabFieldEnabled(mapping.tabId, mapping.fieldId);
      }
      return activeFields.some((activeField) => activeField.field.key === column.key);
    });

    const columnCtx = { fields, enabledTabIds, isTabFieldEnabled };
    return filteredRegistry.filter((column) => canViewContactColumn(viewerRole, column.key, columnCtx));
  }, [fieldConfig.columnRegistry, fields, enabledTabIds, isTabFieldEnabled, viewerRole]);

  const columnRegistry = useMemo(
    () => applyModuleColumnOverlay(tenantColumnRegistry, rawUserColumnOverlay) as ColumnRegistryEntry[],
    [tenantColumnRegistry, rawUserColumnOverlay],
  );

  const getColumnWidth = useCallback(
    (key: string) => {
      const column = columnRegistry.find((entry) => entry.key === key);
      return typeof column?.width === "number" ? column.width : undefined;
    },
    [columnRegistry],
  );

  const setColumnWidth = useCallback(
    (key: string, width: number) => {
      const nextRegistry = columnRegistry.map((column) =>
        column.key === key ? { ...column, width } : column,
      );
      updateUserColumnLayout(nextRegistry);
    },
    [columnRegistry, updateUserColumnLayout],
  );

  const availableColumns = useMemo(() => {
    const translate = (key: Parameters<typeof translateApp>[0]) =>
      translateApp(key, settings.language);
    return columnRegistry.map((column) => ({
      id: column.key,
      label: resolveRegistryLabel(column, translate),
      sortField: column.sortable !== false ? (column.sortField || column.key) : undefined,
      width: column.width,
    }));
  }, [columnRegistry, settings.language]);

  const visibleColumns = useMemo(() => {
    const translate = (key: Parameters<typeof translateApp>[0]) =>
      translateApp(key, settings.language);
    return columnRegistry
      .filter((column) => column.enabled)
      .sort((a, b) => a.order - b.order)
      .map((column) => ({
        id: column.key,
        label: resolveRegistryLabel(column, translate),
        sortField: column.sortable !== false ? (column.sortField || column.key) : undefined,
        width: column.width,
      }));
  }, [columnRegistry, settings.language]);

  const systemSortOptions = useMemo<Array<{ field: string; label: string }>>(() => [
    { field: "createdAt", label: translateApp("contacts.table.dateAdded", settings.language) },
    { field: "updatedAt", label: translateApp("contacts.table.lastUpdated", settings.language) },
  ], [settings.language]);

  return {
    columnRegistry,
    availableColumns,
    visibleColumns,
    getColumnWidth,
    setColumnWidth,
    systemSortOptions,
  };
}
