import type React from "react";
import { Calendar, DollarSign } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionFormDraft } from "@/tenant/features/sessions/components/sessionFormShared";

export interface SessionSelectOption {
  value: string;
  label: string;
}

interface SessionSectionBaseProps {
  sessionDraft: SessionFormDraft;
  errors: Record<string, string>;
  onDraftChange: (patch: Partial<SessionFormDraft>) => void;
}

interface SessionDetailsSectionProps extends SessionSectionBaseProps {
  defaultType: string;
  sessionTypeOptions: SessionSelectOption[];
  statusOptions: SessionSelectOption[];
}

export function SessionDetailsSection({
  defaultType,
  errors,
  sessionDraft,
  sessionTypeOptions,
  statusOptions,
  onDraftChange,
}: SessionDetailsSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm text-start">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <Calendar className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("sessions.form.sectionDetails")}</h3>
        </div>

        <Field label={t("sessions.form.name")} required error={errors.name}>
          <div className="relative flex items-center group/input">
            <Calendar className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={sessionDraft.name || ""}
              onChange={(event) => onDraftChange({ name: event.target.value })}
              placeholder={t("sessions.form.namePlaceholder")}
              className={`${FORM_INPUT} ps-10`}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("sessions.form.type")}>
            <FormSelect
              value={sessionDraft.type || defaultType}
              onChange={(val) => onDraftChange({ type: val })}
              options={sessionTypeOptions}
            />
          </Field>

          <Field label={t("sessions.form.status")}>
            <FormSelect
              value={sessionDraft.status || "active"}
              onChange={(val) => onDraftChange({ status: val })}
              options={statusOptions}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t("sessions.form.startDate")} required error={errors.startDate} id="session-start-date">
            <DatePicker
              id="session-start-date"
              name="startDate"
              value={sessionDraft.startDate || undefined}
              onChange={(dateStr) => onDraftChange({ startDate: dateStr })}
              required
            />
          </Field>

          <Field label={t("sessions.form.endDate")} required error={errors.endDate} id="session-end-date">
            <DatePicker
              id="session-end-date"
              name="endDate"
              value={sessionDraft.endDate || undefined}
              onChange={(dateStr) => onDraftChange({ endDate: dateStr })}
              required
            />
          </Field>
        </div>

        <Field label={t("sessions.form.description")}>
          <Textarea
            value={sessionDraft.description || ""}
            onChange={(event) => onDraftChange({ description: event.target.value })}
            placeholder={t("sessions.form.descriptionPlaceholder")}
            className="min-h-textarea-lg"
          />
        </Field>
      </Card>
    </div>
  );
}

interface SessionFinancialSectionProps extends SessionSectionBaseProps {
  currencyOptions: string[];
  defaultCurrency: string;
}

export function SessionFinancialSection({
  currencyOptions,
  defaultCurrency,
  sessionDraft,
  onDraftChange,
}: SessionFinancialSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm text-start">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <DollarSign className="w-4 h-4 text-primary/70 transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("sessions.form.sectionFinancial")}</h3>
        </div>

        <Field label={t("sessions.form.baseFee")}>
          <div className="relative flex items-center group/input">
            <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              type="number"
              value={sessionDraft.baseFee}
              onChange={(event) => onDraftChange({ baseFee: event.target.value })}
              className={`${FORM_INPUT} ps-10`}
            />
          </div>
        </Field>

        <Field label={t("sessions.form.currency")}>
          <FormSelect
            value={sessionDraft.currency || defaultCurrency}
            onChange={(val) => onDraftChange({ currency: val })}
            options={currencyOptions}
          />
        </Field>
      </Card>
    </div>
  );
}
