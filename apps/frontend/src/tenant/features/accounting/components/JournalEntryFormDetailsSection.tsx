import React from "react";
import { BookOpen } from "lucide-react";
import { type FiscalYear } from '@/lib/data/accountingData';
import { SectionCard } from "@/components/ui/SectionCard";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { DraftForm } from "./journalEntryFormTypes";

interface JournalEntryFormDetailsSectionProps {
  t: TranslationFunction;
  form: DraftForm;
  setForm: React.Dispatch<React.SetStateAction<DraftForm>>;
  errors: Record<string, string>;
  fiscalYears: FiscalYear[];
}

export function JournalEntryFormDetailsSection({ t, form, setForm, errors, fiscalYears }: JournalEntryFormDetailsSectionProps): React.JSX.Element {
  return (
    <SectionCard
      accentColor="primary"
      icon={BookOpen}
      title={t("accounting.journal.form.entryDetails")}
      className="shadow-sm text-start"
    >

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="je-date" className={FORM_LABEL}>{t("accounting.journal.form.dateLabel")}</label>
            <DatePicker
              id="je-date"
              name="date"
              value={form.date}
              onChange={(dateValue) => setForm({ ...form, date: dateValue })}
              required
            />
            <FieldErrorMessage message={errors.date} />
          </div>
          <div>
            <label htmlFor="journal-entry-financial-year" className={FORM_LABEL}>{t("accounting.journal.form.financialYear")}</label>
            <FormSelect
              id="journal-entry-financial-year"
              value={form.fiscal_year || ""}
              onChange={(fiscalYearValue) => setForm({ ...form, fiscal_year: fiscalYearValue })}
              placeholder={t("accounting.journal.form.none")}
              options={(fiscalYears || []).map((fiscalYear) => fiscalYear.label)}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="journal-entry-description" className={FORM_LABEL}>{t("accounting.journal.form.narrationLabel")}</label>
            <div className="relative flex items-center group/input">
              <BookOpen className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
              <Input
                id="journal-entry-description"
                className="ps-10"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder={t("accounting.journal.form.narrationPlaceholder")}
                aria-invalid={!!errors.description}
              />
            </div>
            <FieldErrorMessage message={errors.description} />
          </div>
        </div>
    </SectionCard>
  );
}
