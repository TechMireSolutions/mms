import { useTranslation } from "@/hooks/useTranslation";

export interface ConfigSubTab {
  id: "fields" | "preferences";
  label: string;
}

/** Fields / Preferences sub-tabs for module `setup` tier. */
export function useConfigSubTabs(): ConfigSubTab[] {
  const { t } = useTranslation();
  return [
    { id: "preferences", label: t("module.preferences") },
  ];
}

