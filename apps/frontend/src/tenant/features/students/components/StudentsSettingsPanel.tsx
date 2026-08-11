import { useMemo, useRef, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  STUDENTS_MODULE_MANIFEST,
  type AppTranslationKey,
} from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useStudentFieldConfigQuery } from "@/tenant/features/students/hooks/useStudentSetupConfig";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";

const StudentsSetupPanel = lazy(
  () => import("@/tenant/features/students/components/StudentsSetupPanel"),
);
const StudentsSettingsLookupsPanel = lazy(() =>
  import("@/tenant/features/students/components/StudentsSettingsLookupsPanel").then((mod) => ({
    default: mod.StudentsSettingsLookupsPanel,
  })),
);

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "students.setup.fields",
  preferences: "students.setup.preferences",
  lookups: "students.setup.lookups",
};

/** Students Setup shell — SubTabBar + leave-guard (Contacts SettingsPanel analogue). */
export default function StudentsSettingsPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);
  const { isPending: configPending } = useStudentFieldConfigQuery();
  const dirtyRef = useRef({ fields: false, prefs: false });

  const settingsSubTabs = useMemo(
    () =>
      STUDENTS_MODULE_MANIFEST.setupSubTabs.map((key) => ({
        key,
        label: t(SETUP_TAB_LABEL_KEYS[key]),
      })),
    [t],
  );

  const subTabs = useModuleSetupSubTabs({
    initialKey: settingsSubTabs[0]?.key || "fields",
    isDirty: (currentKey) => {
      if (currentKey === "fields") return dirtyRef.current.fields;
      if (currentKey === "preferences") return dirtyRef.current.prefs;
      return false;
    },
    onDiscard: (leavingKey) => {
      if (leavingKey === "fields") dirtyRef.current.fields = false;
      if (leavingKey === "preferences") dirtyRef.current.prefs = false;
    },
  });

  const setFieldsDirty = (isDirty: boolean): void => {
    dirtyRef.current.fields = isDirty;
  };
  const setPrefsDirty = (isDirty: boolean): void => {
    dirtyRef.current.prefs = isDirty;
  };

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <ErrorBoundary>
        <div className="space-y-4">
          <SubTabBar
            tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
            value={subTabs.sub}
            onChange={subTabs.handleSubTabChange}
          />

          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("students.setupReadOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              {subTabs.showFields ? (
                !configPending ? (
                  <StudentsSetupPanel mode="fields" onFieldsDirtyChange={setFieldsDirty} />
                ) : (
                  <ModulePanelSuspenseFallback />
                )
              ) : null}
              {subTabs.showPrefs ? (
                <StudentsSetupPanel mode="preferences" onPrefsDirtyChange={setPrefsDirty} />
              ) : null}
              {subTabs.showLookups ? <StudentsSettingsLookupsPanel /> : null}
            </Suspense>
          )}

          <ConfirmAlertDialog
            open={subTabs.discardConfirmOpen}
            onOpenChange={(open) => {
              if (!open) subTabs.clearPendingSubTab();
            }}
            title={t("settings.unsavedChanges")}
            description={
              subTabs.discardConfirmIsFields
                ? t("students.setup.discardUnsavedFieldsConfirm")
                : t("students.setup.discardUnsavedPreferencesConfirm")
            }
            confirmLabel={t("common.yes")}
            cancelLabel={t("common.cancel")}
            destructive
            onConfirm={subTabs.handleConfirmDiscard}
          />
        </div>
      </ErrorBoundary>
    </motion.div>
  );
}
