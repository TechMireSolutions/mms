import React from "react";
import { User, BookOpen, Layers, DollarSign, CheckCircle2 } from "lucide-react";
import { calcAge, Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';
import { CalculatedFee } from '@/lib/data/enrollmentData';
import { formatMoney } from "@mms/shared";
import { useEnrollmentConfig } from "@/tenant/features/enrollments/hooks/useEnrollmentConfig";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  customFieldValues: Record<string, any>;
  onCustomFieldChange: (id: string, value: any) => void;
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
  const age = student ? calcAge(student.dob) : null;

  const { fields, orderedFields: allOrderedFields } = useEnrollmentConfig();

  const orderedFields = React.useMemo(() => {
    return allOrderedFields.filter((field) => !["studentId", "sessionId", "classId"].includes(field.id));
  }, [allOrderedFields]);

  return (
    <section className="space-y-4" aria-labelledby="step6-title">
      <div>
        <h3 id="step6-title" className="text-base font-bold text-foreground">Confirm Enrollment</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Review all details before submitting.</p>
      </div>

      <div className="space-y-3">
        <Section icon={User} title="Student">
          <Row label="Name"   value={student?.name} />
          <Row label="Gender" value={student?.gender} />
          <Row label="Age"    value={age ? `${age} years old` : "Unknown"} />
          <Row label="Father" value={student?.fatherName} />
        </Section>

        <Section icon={BookOpen} title="Session">
          <Row label="Session" value={session?.name} />
          <Row label="Type"    value={session?.type} />
          <Row label="Starts"  value={session?.startDate} />
          <Row label="Ends"    value={session?.endDate} />
        </Section>

        <Section icon={Layers} title="Class">
          <Row label="Class"   value={classInfo?.name} />
          <Row label="Teacher" value={classInfo?.teacherName} />
          {classInfo?.room && <Row label="Room"    value={classInfo.room} />}
          <Row label="Age Range" value={classInfo ? `${classInfo.ageMin}–${classInfo.ageMax} yrs` : "—"} />
        </Section>

        <Section icon={DollarSign} title="Fee">
          <Row label="Base Fee" value={session ? formatMoney(session.baseFee) : "—"} />
          <Row label={feeResult?.label || "Discount"} value={feeResult && feeResult.pct > 0 ? `– ${formatMoney(feeResult.discountAmt)} (${feeResult.pct}%)` : "None"} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold text-foreground">Total Due</span>
            <span className="text-sm font-bold text-primary">{formatMoney(feeResult?.finalFee)}</span>
          </div>
        </Section>
      </div>

      {/* Dynamic Render Notes & Custom Fields */}
      <div className="space-y-4">
        {orderedFields.map((field) => {
          const isEnabled = fields[field.id]?.enabled !== false;
          if (!isEnabled) return null;

          if (field.id === "notes") {
            return (
              <div key="notes">
                <label htmlFor="enrollment-notes" className={FORM_LABEL}>
                  Notes {field.required ? "*" : ""}
                </label>
                <Textarea
                  id="enrollment-notes"
                  name="notes"
                  value={notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder="Any additional notes about this enrollment…"
                  className="min-h-[80px]"
                  required={field.required}
                />
              </div>
            );
          }

          if (!["studentId", "sessionId", "classId", "notes"].includes(field.id)) {
            const fieldValue = customFieldValues[field.id] ?? "";
            return (
              <div key={field.id}>
                <label className={FORM_LABEL}>
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`custom-${field.id}`}
                    name={field.id}
                    value={fieldValue}
                    onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <FormSelect
                    id={`custom-${field.id}`}
                    name={field.id}
                    value={fieldValue}
                    onChange={(val) => onCustomFieldChange(field.id, val)}
                    options={field.options || []}
                    placeholder="Select option…"
                  />
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                    <Checkbox
                      id={`custom-${field.id}`}
                      name={field.id}
                      checked={!!fieldValue}
                      onCheckedChange={(checked) => onCustomFieldChange(field.id, checked)}
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : (
                  <Input
                    id={`custom-${field.id}`}
                    name={field.id}
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    value={fieldValue}
                    onChange={(event) => onCustomFieldChange(field.id, event.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
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
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5" role="note" aria-label="Process steps after confirmation">
        <p className="text-xs font-bold text-foreground">What happens next?</p>
        {[
          "Enrollment record created with Pending status",
          "Invoice auto-generated for " + (formatMoney(feeResult?.finalFee) || "—"),
          "Notification sent to parent/guardian",
          "Status → Confirmed once payment is received",
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
