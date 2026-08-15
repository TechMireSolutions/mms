import type { AppTranslationKey, TabDefinition } from "@mms/shared";
import { notify } from "@/lib/notify";
import { safeAudit } from "@/lib/safeAudit";

type Translate = (key: AppTranslationKey, params?: Record<string, string>) => string;

/**
 * Shared Setup Fields save choreography:
 * sync custom_tabs → persist field-config (no formTabs dual-write) → audit → toast.
 * Callers build `formTabs` / field-config payload; prefs stay module-local.
 */
export async function runModuleFieldsSetupSave({
  formTabs,
  syncCustomTabs,
  persistFieldConfig,
  markDraftPristine,
  auditPromise,
  auditChannel,
  t,
  successKey,
  failureKey,
  setSaved,
}: {
  formTabs: TabDefinition[];
  syncCustomTabs?: (formTabs: TabDefinition[]) => Promise<void>;
  persistFieldConfig: () => Promise<void>;
  markDraftPristine?: () => void;
  auditPromise: Promise<unknown>;
  auditChannel: string;
  t: Translate;
  successKey: AppTranslationKey;
  failureKey: AppTranslationKey;
  setSaved: (value: boolean) => void;
}): Promise<void> {
  try {
    if (syncCustomTabs) {
      await syncCustomTabs(formTabs);
    }
    await persistFieldConfig();
    safeAudit(auditPromise, auditChannel);
    markDraftPristine?.();
    notify.success(t(successKey));
    setSaved(true);
  } catch {
    setSaved(false);
    notify.error(t(failureKey));
    throw new Error("module_fields_setup_save_failed");
  }
}
