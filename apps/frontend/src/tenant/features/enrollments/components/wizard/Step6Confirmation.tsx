import React from "react";
import { User, BookOpen, Layers, DollarSign, CheckCircle2 } from "lucide-react";
import { formatDate } from "@mms/shared";
import { calcAge, Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';
import { CalculatedFee } from '@/lib/data/enrollmentData';
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useEnrollmentConfig } from "@/hooks/useStandardModuleConfig";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";

interface RowProps {
  label: string;
  value: React.ReactNode;
}

/**
 * Data row helper for layout summary.
 *
 * @returns Component layout.
 */
function Row({ label, value }: RowProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value || "—"}</span>
    </div>
  );
}

interface SectionProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  children: React.ReactNode;
}

/**
 * Summary section helper.
 *
 * @returns Component layout.
 */
function Section({ icon: Icon, title, children }: SectionProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden" aria-label={title}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</h4>
      </div>
      <div className="px-4">{children}</div>
    </section>
  );
}

interface Step6ConfirmationProps {
  student: Student | null | undefined;
  session: Session | null | undefined;
  classInfo: Class | null | undefined;
  feeResult: CalculatedFee | null | undefined;
  notes: string;
  onNotesChange: (notes: string) => void;
  customFieldValues: Record<string, unknown>;
  onCustomFieldChange: (id: string, value: unknown) => void;
}

/**
 * Step 6 component for verifying all selected configuration details.
 */
export function Step6Confirmation({
  student,
  session,
  classInfo,
  feeResult,
  notes,
  onNotesChange,
  customFieldValues,
  onCustomFieldChange,
}: Step6ConfirmationProps): React.ReactElement {
  const { t } = useTranslation();
  const age = student ? calcAge(student.dob) : null;

  const { orderedFields: allOrderedFields, isFieldEnabled } = useEnrollmentConfig();
  const { formatCurrency } = useFinanceCurrency();

  const orderedFields = React.useMemo(() => {
    return allOrderedFields.filter((field) => !["studentId", "sessionId", "classId"].includes(field.id));
  }, [allOrderedFields]);

  return (
    <section className="space-y-4" aria-labelledby="step6-title">
      <div>
        <h3 id="step6-title" className="text-base font-bold text-foreground">{t("enrollments.wizard.step6Title")}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t("enrollments.wizard.step6Desc")}</p>
      </div>

      <div className="space-y-3">
        <Section icon={User} title={t("enrollments.wizard.step6SectionStudent")}>
          <Row label={t("enrollments.detail.name")} value={student?.name} />
          <Row label={t("enrollments.wizard.step6RowGender")} value={student?.gender} />
          <Row label={t("enrollments.wizard.step6RowAge")} value={age ? t("enrollments.wizard.step6YearsOld", { age }) : t("enrollments.wizard.step6Unknown")} />
          <Row label={t("enrollments.wizard.step6RowFather")} value={student?.fatherName} />
        </Section>

        <Section icon={BookOpen} title={t("enrollments.wizard.step6SectionSession")}>
          <Row label={t("enrollments.detail.session")} value={session?.name} />
          <Row label={t("enrollments.wizard.step6RowType")} value={session?.type} />
          <Row label={t("enrollments.wizard.step6RowStarts")} value={session?.startDate ? formatDate(session.startDate) : undefined} />
          <Row label={t("enrollments.wizard.step6RowEnds")} value={session?.endDate ? formatDate(session.endDate) : undefined} />
        </Section>

        <Section icon={Layers} title={t("enrollments.wizard.step6SectionClass")}>
          <Row label={t("enrollments.detail.class")} value={classInfo?.name} />
          <Row label={t("enrollments.wizard.step6RowTeacher")} value={classInfo?.teacherName} />
          {classInfo?.room && <Row label={t("enrollments.wizard.step6RowRoom")} value={classInfo.room} />}
          <Row label={t("enrollments.wizard.step6RowAgeRange")} value={classInfo ? t("enrollments.wizard.step6AgeRangeValue", { min: classInfo.ageMin, max: classInfo.ageMax }) : "—"} />
        </Section>

        <Section icon={DollarSign} title={t("enrollments.wizard.step6SectionFee")}>
          <Row label={t("enrollments.detail.baseFee")} value={session ? formatCurrency(session.baseFee) : "—"} />
          <Row label={feeResult?.label || t("enrollments.detail.discount")} value={feeResult && feeResult.pct > 0 ? `– ${formatCurrency(feeResult.discountAmt)} (${feeResult.pct}%)` : t("enrollments.detail.none")} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold text-foreground">{t("enrollments.detail.totalDue")}</span>
            <span className="text-sm font-bold text-primary">{formatCurrency(feeResult?.finalFee)}</span>
          </div>
        </Section>
      </div>

      {/* Dynamic Render Notes & Custom Fields */}
      <div className="space-y-4">
        {orderedFields.map((field) => {
          const isEnabled = isFieldEnabled(field.id);
          if (!isEnabled) return null;

          if (field.id === "notes") {
            return (
              <div key="notes">
                <label htmlFor="enrollment-notes" className={FORM_LABEL}>
                  {t("attendance.columns.notes")} {field.required ? "*" : ""}
                </label>
                <Textarea
                  id="enrollment-notes"
                  name="notes"
                  value={notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder={t("enrollments.wizard.step6NotesPlaceholder")}
                  className="min-h-[80px]"
                  required={field.required}
                />
              </div>
            );
          }

          if (!["studentId", "sessionId", "classId", "notes"].includes(field.id)) {
            const rawValue = customFieldValues[field.id];
            const stringValue = typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "";
            const boolValue = Boolean(rawValue);
            return (
              <div key={field.id}>
                <label className={FORM_LABEL}>
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`custom-${field.id}`}
                    name={field.id}
                    value={stringValue}
                    onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <FormSelect
                    id={`custom-${field.id}`}
                    name={field.id}
                    value={stringValue}
                    onChange={(val) => onCustomFieldChange(field.id, val)}
                    options={field.options || []}
                    placeholder={t("enrollments.wizard.step6SelectOption")}
                  />
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                    <Checkbox
                      id={`custom-${field.id}`}
                      name={field.id}
                      checked={boolValue}
                      onCheckedChange={(checked) => onCustomFieldChange(field.id, checked)}
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : (
                  <Input
                    id={`custom-${field.id}`}
                    name={field.id}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    value={stringValue}
                    onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder || t("enrollments.wizard.step6EnterField", { label: field.label.toLowerCase() })}
                    required={field.required}
                  />
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5" role="note" aria-label={t("enrollments.wizard.step6NextAria")}>
        <p className="text-xs font-bold text-foreground">{t("enrollments.wizard.step6NextTitle")}</p>
        {[
          t("enrollments.wizard.step6NextCreated"),
          t("enrollments.wizard.step6NextInvoice", { amount: formatCurrency(feeResult?.finalFee) || "—" }),
          t("enrollments.wizard.step6NextNotification"),
          t("enrollments.wizard.step6NextConfirmed"),
        ].map((item, index) => (
          <div key={`${index}-${item}`} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
