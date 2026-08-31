import { DEFAULT_COLUMN_REGISTRY, type ColumnRegistryEntry } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { useTranslation } from "@/hooks/useTranslation";
import type { ModuleColumnCustomizerLabels } from "@/components/ui/moduleColumnCustomizerTypes";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface ContactsListFiltersSortOption {
  field: string;
  label: string;
}

export interface ContactsListFiltersModel {
  t: TranslationFunction;
  genders: string[];
  sortOptions: ContactsListFiltersSortOption[];
  columnRegistry: ColumnRegistryEntry[];
  updateUserColumnLayout: (columns: ColumnRegistryEntry[]) => void;
  handleResetColumnLayout: () => void;
  columnCustomizerLabels: ModuleColumnCustomizerLabels;
}

export function useContactsToolbarModel(): ContactsListFiltersModel {
  const { availableColumns, genders, systemSortOptions, columnRegistry, updateUserColumnLayout } =
    useContactConfig();
  const { t } = useTranslation();

  const sortOptions = (() => {
    const dynamicSorts: ContactsListFiltersSortOption[] = availableColumns
      .filter((column): column is typeof column & { sortField: string } => Boolean(column.sortField))
      .map((column) => ({
        field: column.sortField,
        label: column.label,
      }));

    const combined = [...dynamicSorts];
    systemSortOptions.forEach((systemSortOption) => {
      if (!combined.some((existingSortOption) => existingSortOption.field === systemSortOption.field)) {
        combined.push(systemSortOption);
      }
    });

    return combined;
  })() as ContactsListFiltersSortOption[];

  const handleResetColumnLayout = (() => {
    updateUserColumnLayout(DEFAULT_COLUMN_REGISTRY);
  });

  const columnCustomizerLabels = (() => ({
      trigger: t("contacts.columns"),
      title: t("contacts.columns"),
      visibleAndOrder: t("contacts.visibleAndOrder"),
      hidden: t("contacts.hidden"),
      fixed: t("contacts.fixed"),
      hideColumn: (label: string) => t("contacts.hideColumn", { label }),
      reset: t("contacts.resetLayout"),
      searchPlaceholder: t("contacts.searchColumnsPlaceholder"),
    }))() as ModuleColumnCustomizerLabels;

  return {
    t,
    genders,
    sortOptions,
    columnRegistry,
    updateUserColumnLayout,
    handleResetColumnLayout,
    columnCustomizerLabels,
  };
}
