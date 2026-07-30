import React from "react";
import { BookOpen } from "lucide-react";
import { type Account, type JournalEntry, type FiscalYear } from '@/lib/data/accountingData';
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/button";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { JournalEntryLinesEditor } from "./JournalEntryLinesEditor";
import {
  JournalEntryFormDetailsSection,
} from "./JournalEntryFormDetailsSection";
import { JournalEntryFormTagsSection } from "./JournalEntryFormTagsSection";
import { useJournalEntryForm } from "./useJournalEntryForm";

interface JournalEntryFormProps {
  accounts: Account[];
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void | Promise<void>;
  onClose: () => void;
  initial?: JournalEntry | null;
  fiscalYears: FiscalYear[];
}

export function JournalEntryForm({ accounts, entries, onSave, onClose, initial, fiscalYears }: JournalEntryFormProps) {
  const { formatCurrency } = useAccountingCurrency();
  const {
    t,
    isEdit,
    activeFiscalYear,
    form,
    setForm,
    errors,
    submitting,
    totalDebit,
    totalCredit,
    isBalanced,
    completeness,
    updateLine,
    addLine,
    removeLine,
    toggleTag,
    saveEntry,
    flattenedAccountOptions,
    errorMessages,
  } = useJournalEntryForm({ accounts, entries, onSave, initial, fiscalYears });

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? t("accounting.journal.form.editTitle") : t("accounting.journal.form.newTitle")}
      subtitle={activeFiscalYear || undefined}
      icon={BookOpen}
      size="xl"
      tall
      progress={completeness}
      progressLabel={t("common.formProgress")}
      cancelLabel={t("accounting.journal.form.cancel")}
      saveLabel={t("accounting.journal.form.postEntry")}
      onSave={() => { void saveEntry("posted"); }}
      saving={submitting}
      saveDisabled={!isBalanced || submitting}
      error={errorMessages}
      footerStart={
        <Button type="button" variant="secondary" disabled={submitting} onClick={() => { void saveEntry("draft"); }}>
          {t("accounting.journal.form.saveDraft")}
        </Button>
      }
    >
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <JournalEntryFormDetailsSection
          t={t}
          form={form}
          setForm={setForm}
          errors={errors}
          fiscalYears={fiscalYears}
        />

        <JournalEntryFormTagsSection t={t} form={form} toggleTag={toggleTag} />

        <JournalEntryLinesEditor
          accounts={accounts}
          accountOptions={flattenedAccountOptions}
          errors={errors}
          lines={form.lines}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
          isBalanced={isBalanced}
          formatCurrency={formatCurrency}
          onAddLine={addLine}
          onRemoveLine={removeLine}
          onUpdateLine={updateLine}
        />
      </form>
    </FormModal>
  );
}
