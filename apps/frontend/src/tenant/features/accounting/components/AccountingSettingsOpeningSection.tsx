import React, { useEffect, useState } from "react";
import { type Account, type FiscalYear } from "@mms/shared";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  useOpeningBalances,
  usePostOpeningBalances,
  useSaveOpeningBalances,
} from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";

interface AccountingSettingsOpeningSectionProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
}

export function AccountingSettingsOpeningSection({
  accounts,
  fiscalYears,
}: AccountingSettingsOpeningSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const sortedYears = [...fiscalYears].sort((left, right) => right.startDate.localeCompare(left.startDate));
  const [fiscalYearId, setFiscalYearId] = useState(sortedYears[0]?.id ?? "");
  const [accountId, setAccountId] = useState("");
  const [debit, setDebit] = useState("0");
  const [credit, setCredit] = useState("0");
  const { data: balances = [] } = useOpeningBalances(fiscalYearId || undefined);
  const save = useSaveOpeningBalances();
  const post = usePostOpeningBalances();

  useEffect(() => {
    if (!fiscalYearId && sortedYears[0]) setFiscalYearId(sortedYears[0].id);
  }, [fiscalYearId, sortedYears]);

  const handleAdd = async (): Promise<void> => {
    if (!fiscalYearId || !accountId) return;
    try {
      await save.mutateAsync({
        fiscalYearId,
        balances: [
          ...balances,
          { id: `ob-${Date.now()}`, fiscalYearId, accountId, debit: Number(debit || 0), credit: Number(credit || 0) },
        ],
      });
      setDebit("0");
      setCredit("0");
      notify.success(t("accounting.settings.opening.saved"));
    } catch (error) {
      notify.error(t("accounting.settings.opening.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handlePost = async (): Promise<void> => {
    if (!fiscalYearId) return;
    try {
      await post.mutateAsync(fiscalYearId);
      notify.success(t("accounting.settings.opening.posted"));
    } catch (error) {
      notify.error(t("accounting.settings.opening.postFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <SectionCard title={t("accounting.settings.secOpening")} icon={Scale} className={SETUP_SECTION_CARD_CLASS}>
      <p className="m-0 mb-3 text-xs text-muted-foreground">{t("accounting.settings.opening.hint")}</p>
      <Field label={t("accounting.settings.fy.label")}>
        <FormSelect
          id="opening-fy"
          value={fiscalYearId}
          onChange={setFiscalYearId}
          options={sortedYears.map((year) => ({ value: year.id, label: year.label }))}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FormSelect
          id="opening-account"
          value={accountId}
          onChange={setAccountId}
          placeholder={t("accounting.settings.opening.account")}
          options={accounts
            .filter((account) => account.isActive !== false)
            .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
        />
        <Input className={FORM_INPUT} inputMode="decimal" value={debit} onChange={(event) => setDebit(event.target.value)} aria-label={t("accounting.settings.opening.debit")} />
        <Input className={FORM_INPUT} inputMode="decimal" value={credit} onChange={(event) => setCredit(event.target.value)} aria-label={t("accounting.settings.opening.credit")} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" className="min-h-11" onClick={() => void handleAdd()} disabled={!fiscalYearId || !accountId || save.isPending}>
          {t("accounting.settings.opening.add")}
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => void handlePost()} disabled={!fiscalYearId || post.isPending}>
          {t("accounting.settings.opening.post")}
        </Button>
      </div>
      <p className="m-0 mt-3 text-xs text-muted-foreground">
        {t("accounting.settings.opening.count", { count: String(balances.length) })}
      </p>
    </SectionCard>
  );
}
