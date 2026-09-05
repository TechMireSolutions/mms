import React, { useState } from "react";
import { type Account } from "@mms/shared";
import { Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { todayISO } from "@mms/shared";
import {
  useBankStatements,
  useMatchBankReconciliation,
  useSaveBankStatement,
} from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";

interface AccountingSettingsBankRecSectionProps {
  accounts: Account[];
}

export function AccountingSettingsBankRecSection({
  accounts,
}: AccountingSettingsBankRecSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: statements = [] } = useBankStatements();
  const save = useSaveBankStatement();
  const match = useMatchBankReconciliation();
  const [accountId, setAccountId] = useState("");
  const [periodStart, setPeriodStart] = useState(todayISO());
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [closingBalance, setClosingBalance] = useState("0");
  const [lineDate, setLineDate] = useState(todayISO());
  const [lineDesc, setLineDesc] = useState("");
  const [lineAmount, setLineAmount] = useState("0");
  const [journalEntryId, setJournalEntryId] = useState("");
  const [journalLineId, setJournalLineId] = useState("");
  const [statementLineId, setStatementLineId] = useState("");

  const handleSave = async (): Promise<void> => {
    if (!accountId) return;
    try {
      await save.mutateAsync({
        accountId,
        periodStart,
        periodEnd,
        openingBalance: 0,
        closingBalance: Number(closingBalance || 0),
        lines: lineDesc.trim()
          ? [{ date: lineDate, description: lineDesc.trim(), amount: Number(lineAmount || 0) }]
          : [],
      });
      notify.success(t("accounting.settings.bankRec.saved"));
    } catch (error) {
      notify.error(t("accounting.settings.bankRec.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleMatch = async (): Promise<void> => {
    if (!statementLineId || !journalEntryId || !journalLineId) return;
    try {
      await match.mutateAsync({ statementLineId, journalEntryId, journalLineId });
      notify.success(t("accounting.settings.bankRec.matched"));
    } catch (error) {
      notify.error(t("accounting.settings.bankRec.matchFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <SectionCard title={t("accounting.settings.secBankRec")} icon={Landmark} className={SETUP_SECTION_CARD_CLASS}>
      <p className="m-0 mb-3 text-xs text-muted-foreground">{t("accounting.settings.bankRec.hint")}</p>
      <Field label={t("accounting.settings.bankRec.account")}>
        <FormSelect
          id="bank-rec-account"
          value={accountId}
          onChange={setAccountId}
          options={accounts
            .filter((account) => account.type === "Asset" && account.isActive !== false)
            .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
        />
      </Field>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker id="bank-period-start" value={periodStart} onChange={setPeriodStart} />
        <DatePicker id="bank-period-end" value={periodEnd} onChange={setPeriodEnd} />
      </div>
      <Input
        className={`${FORM_INPUT} mt-3`}
        inputMode="decimal"
        value={closingBalance}
        onChange={(event) => setClosingBalance(event.target.value)}
        aria-label={t("accounting.settings.bankRec.closing")}
      />
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DatePicker id="bank-line-date" value={lineDate} onChange={setLineDate} />
        <Input className={FORM_INPUT} value={lineDesc} onChange={(event) => setLineDesc(event.target.value)} aria-label={t("accounting.settings.bankRec.lineDesc")} />
        <Input className={FORM_INPUT} inputMode="decimal" value={lineAmount} onChange={(event) => setLineAmount(event.target.value)} aria-label={t("accounting.settings.bankRec.lineAmount")} />
      </div>
      <Button type="button" className="mt-3 min-h-11" onClick={() => void handleSave()} disabled={!accountId || save.isPending}>
        {t("accounting.settings.bankRec.add")}
      </Button>
      <p className="m-0 mt-3 text-xs text-muted-foreground">
        {t("accounting.settings.bankRec.count", { count: String(statements.length) })}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input className={FORM_INPUT} value={statementLineId} onChange={(event) => setStatementLineId(event.target.value)} aria-label={t("accounting.settings.bankRec.statementLine")} />
        <Input className={FORM_INPUT} value={journalEntryId} onChange={(event) => setJournalEntryId(event.target.value)} aria-label={t("accounting.settings.bankRec.journalEntry")} />
        <Input className={FORM_INPUT} value={journalLineId} onChange={(event) => setJournalLineId(event.target.value)} aria-label={t("accounting.settings.bankRec.journalLine")} />
      </div>
      <Button type="button" variant="outline" className="mt-3 min-h-11" onClick={() => void handleMatch()} disabled={match.isPending}>
        {t("accounting.settings.bankRec.match")}
      </Button>
    </SectionCard>
  );
}
