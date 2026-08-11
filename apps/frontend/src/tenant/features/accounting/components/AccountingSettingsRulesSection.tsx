import type React from "react";
import { type AccountingSettings } from "@mms/shared";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account } from "@/lib/data/accountingData";
import { AccountingSettingsField } from "./AccountingSettingsField";
import { SectionCard } from "@/components/ui/SectionCard";

interface AccountingSettingsRulesSectionProps {
  accounts: Account[];
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
}

export function AccountingSettingsRulesSection({
  accounts,
  settingsDraft,
  upd,
}: AccountingSettingsRulesSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <SectionCard title={t("accounting.settings.secRules")}>
        <AccountingSettingsField label={t("accounting.settings.fields.requireNarration")} hint={t("accounting.settings.fields.requireNarrationHint")}>
          <Switch aria-label={t("accounting.settings.fields.requireNarration")} checked={settingsDraft.requireNarration} onCheckedChange={(checked) => upd("requireNarration", checked)} />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.allowEditPosted")} hint={t("accounting.settings.fields.allowEditPostedHint")}>
          <Switch aria-label={t("accounting.settings.fields.allowEditPosted")} checked={settingsDraft.allowEditPosted} onCheckedChange={(checked) => upd("allowEditPosted", checked)} />
          {settingsDraft.allowEditPosted && (
            <p className="text-xs text-warning mt-1 font-semibold m-0" role="alert">{t("accounting.settings.fields.allowEditPostedWarning")}</p>
          )}
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.autoPostDrafts")} hint={t("accounting.settings.fields.autoPostDraftsHint")}>
          <Switch aria-label={t("accounting.settings.fields.autoPostDrafts")} checked={settingsDraft.autoPostDrafts} onCheckedChange={(checked) => upd("autoPostDrafts", checked)} />
        </AccountingSettingsField>
      </SectionCard>

      <SectionCard title={t("accounting.settings.secNumbering")}>
        <AccountingSettingsField label={t("accounting.settings.fields.defaultCodeLength")} hint={t("accounting.settings.fields.defaultCodeLengthHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.defaultCodeLength")}
            value={String(settingsDraft.accountCodeLength ?? 4)}
            onChange={(codeLengthValue) => upd("accountCodeLength", parseInt(codeLengthValue))}
            options={[3, 4, 5, 6].map((digitCount) => String(digitCount))}
            className="w-32"
          />
        </AccountingSettingsField>
        <AccountingSettingsField label={t("accounting.settings.fields.retainedEarningsAccount")} hint={t("accounting.settings.fields.retainedEarningsAccountHint")}>
          <FormSelect
            aria-label={t("accounting.settings.fields.retainedEarningsAccount")}
            value={settingsDraft.retainedEarningsAccount || ""}
            onChange={(accountId) => upd("retainedEarningsAccount", accountId)}
            placeholder={t("accounting.journal.form.none")}
            options={accounts
              .filter((account) => account.type === "Equity" && account.isActive !== false)
              .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
              .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
          />
        </AccountingSettingsField>
      </SectionCard>
    </>
  );
}
