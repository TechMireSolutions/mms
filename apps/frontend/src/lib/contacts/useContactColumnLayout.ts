import { useCallback, useMemo } from "react";
import {
  translateApp,
  ColumnRegistryEntry,
  DEFAULT_COLUMN_REGISTRY,
  canViewContactColumn,
  CONTACTS_MODULE_MANIFEST,
  migrateContactColumnPreferenceKeys,
  type ModuleColumnRegistryEntry,
} from "@mms/shared";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { resolveRegistryLabel } from "@/lib/contacts/contactI18n";
import type { ContactsColumnConfig } from "@/lib/contacts/contactConfigContextTypes";
import { useModuleColumnLayout } from "@/hooks/useModuleColumnLayout";
import {
  useContactColumnPrefs,
  useContactColumnPrefsMutation,
} from "@/tenant/hooks/collections/contacts";
import { useAuth } from "@/lib/contexts/AuthContext";

function toContactsColumnConfig(
  column: ColumnRegistryEntry,
  translate: (key: Parameters<typeof translateApp>[0]) => string,
): ContactsColumnConfig {
  return {
    id: column.key,
    label: resolveRegistryLabel(column, translate),
    sortField: column.sortable !== false ? (column.sortField || column.key) : undefined,
    width: column.width,
  };
}

/**
 * Contacts Work column layout: tenant registry (Setup sync + RBAC) + shared
 * {@link useModuleColumnLayout} overlay/persist path.
 */
export function useContactColumnLayout({
  viewerRole,
}: {
  viewerRole: string;
}) {
  const settings = useGlobalSettings();
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : "";

  const { data: serverColumnPrefs, isSuccess: columnPrefsLoaded } = useContactColumnPrefs({
    enabled: Boolean(userId),
  });
  const { mutate: saveColumnPrefs } = useContactColumnPrefsMutation();

  const tenantRegistry = useMemo((): ColumnRegistryEntry[] => {
    // Simply filter DEFAULT_COLUMN_REGISTRY based on role
    return DEFAULT_COLUMN_REGISTRY.filter((column) => 
      canViewContactColumn(viewerRole, column.key, { 
        fields: {}, enabledTabIds: new Set(), isTabFieldEnabled: () => true 
      })
    );
  }, [viewerRole]);

  const {
    columnRegistry: layoutRegistry,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout: updateLayout,
    isColumnVisible,
  } = useModuleColumnLayout({
    moduleId: CONTACTS_MODULE_MANIFEST.moduleId,
    tenantRegistry: tenantRegistry as ModuleColumnRegistryEntry[],
    serverColumnPrefs: serverColumnPrefs ?? null,
    columnPrefsLoaded,
    saveColumnPrefs,
    normalizePreferences: migrateContactColumnPreferenceKeys,
    translationPrefix: "contacts.columns",
  });

  const columnRegistry = layoutRegistry as ColumnRegistryEntry[];

  const updateUserColumnLayout = useCallback(
    (nextRegistry: ColumnRegistryEntry[]) => {
      updateLayout(nextRegistry as ModuleColumnRegistryEntry[]);
    },
    [updateLayout],
  );

  const availableColumns = useMemo((): ContactsColumnConfig[] => {
    const translate = (key: Parameters<typeof translateApp>[0]) =>
      translateApp(key, settings.language);
    const seen = new Set<string>();
    return columnRegistry
      .filter((col) => {
        if (seen.has(col.key)) return false;
        seen.add(col.key);
        return true;
      })
      .map((col) => toContactsColumnConfig(col, translate));
  }, [columnRegistry, settings.language]);

  const visibleColumns = useMemo((): ContactsColumnConfig[] => {
    const translate = (key: Parameters<typeof translateApp>[0]) =>
      translateApp(key, settings.language);
    const seen = new Set<string>();
    return columnRegistry
      .filter((column) => column.enabled)
      .sort((a, b) => a.order - b.order)
      .filter((column) => {
        if (seen.has(column.key)) return false;
        seen.add(column.key);
        return true;
      })
      .map((col) => toContactsColumnConfig(col, translate));
  }, [columnRegistry, settings.language]);

  const systemSortOptions = useMemo<Array<{ field: string; label: string }>>(
    () => [
      { field: "createdAt", label: translateApp("contacts.table.dateAdded", settings.language) },
      { field: "updatedAt", label: translateApp("contacts.table.lastUpdated", settings.language) },
    ],
    [settings.language],
  );

  return {
    columnRegistry,
    availableColumns,
    visibleColumns,
    getColumnWidth,
    setColumnWidth,
    updateUserColumnLayout,
    isColumnVisible,
    systemSortOptions,
  };
}
