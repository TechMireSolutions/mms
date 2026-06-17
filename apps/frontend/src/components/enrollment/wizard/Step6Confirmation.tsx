import React from "react";
import { User, BookOpen, Layers, DollarSign, CheckCircle2 } from "lucide-react";
import { calcAge, Student } from '@/lib/data/studentsData';
import { Session, Class } from '@/lib/data/sessionsData';
import { CalculatedFee } from '@/lib/data/enrollmentData';
import { getObject } from "../../../lib/db";
import {
  type EnrollmentsSettings,
  DEFAULT_ENROLLMENTS_SETTINGS,
  DEFAULT_ENROLLMENTS_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { FORM_INPUT, FORM_LABEL, FORM_SELECT, FORM_TEXTAREA } from "@/components/ui/formStyles";

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
export default function Step6Confirmation({
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

  const settings = React.useMemo(() => getObject<EnrollmentsSettings>("enrollments_settings", DEFAULT_ENROLLMENTS_SETTINGS), []);
  const fields = settings.fields || DEFAULT_ENROLLMENTS_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_ENROLLMENTS_SETTINGS.fieldOrder || [];

  const orderedFields = React.useMemo(() => {
    return getSortedFields(DEFAULT_ENROLLMENTS_FIELD_DEFS, fieldOrder, fields, customFields)
      .filter((f) => !["studentId", "sessionId", "classId"].includes(f.id));
  }, [fieldOrder, fields, customFields]);

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
          <Row label="Base Fee" value={session ? `PKR ${session.baseFee?.toLocaleString()}` : "—"} />
          <Row label={feeResult?.label || "Discount"} value={feeResult && feeResult.pct > 0 ? `– PKR ${feeResult.discountAmt?.toLocaleString()} (${feeResult.pct}%)` : "None"} />
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-bold text-foreground">Total Due</span>
            <span className="text-sm font-bold text-primary">PKR {feeResult?.finalFee?.toLocaleString() || "—"}</span>
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
                <textarea
                  id="enrollment-notes"
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={3}
                  placeholder="Any additional notes about this enrollment…"
                  className={FORM_TEXTAREA}
                  required={field.required}
                />
              </div>
            );
          }

          if (!["studentId", "sessionId", "classId", "notes"].includes(field.id)) {
            const val = customFieldValues[field.id] ?? "";
            return (
              <div key={field.id}>
                <label className={FORM_LABEL}>
                  {field.label} {field.required ? "*" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className={FORM_TEXTAREA}
                    rows={3}
                    value={val}
                    onChange={(e) => onCustomFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    className={FORM_SELECT}
                    value={val}
                    onChange={(e) => onCustomFieldChange(field.id, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select option…</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!val}
                      onChange={(e) => onCustomFieldChange(field.id, e.target.checked)}
                      className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-foreground">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    className={FORM_INPUT}
                    value={val}
                    onChange={(e) => onCustomFieldChange(field.id, e.target.value)}
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
          "Invoice auto-generated for PKR " + (feeResult?.finalFee?.toLocaleString() || "—"),
          "Notification sent to parent/guardian",
          "Status → Confirmed once payment is received",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
