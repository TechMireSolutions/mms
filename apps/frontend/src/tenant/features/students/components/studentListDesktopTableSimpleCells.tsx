import { calcAge, formatDate, type Student } from "@mms/shared";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { StudentListTableProps } from "@/tenant/features/students/components/StudentListContentTypes";

/** DOB cell — age + formatted date. */
export function renderStudentDobCell({
  studentRow,
  emptyDash,
  t,
}: {
  studentRow: Student;
  emptyDash: string;
  t: TranslationFunction;
}): React.ReactNode {
  const age = calcAge(studentRow.dob);
  return (
    <>
      <p className="text-sm font-medium text-foreground">
        {age ? t("students.list.ageYears", { age }) : emptyDash}
      </p>
      <p className="text-xs text-muted-foreground">{formatDate(studentRow.dob, true)}</p>
    </>
  );
}

/** Sessions cell — enrolled session-name pills (or empty note). */
export function renderStudentSessionsCell({
  sessionNames,
  t,
}: {
  sessionNames: string[];
  t: TranslationFunction;
}): React.ReactNode {
  return (
    <div className="flex flex-wrap gap-1">
      {sessionNames.length === 0 ? (
        <span className="text-xs text-muted-foreground italic">
          {t("students.list.notEnrolled")}
        </span>
      ) : (
        sessionNames.map((sessionName) => (
          <FormFooterBadge
            key={sessionName}
            tone="primary"
            className="px-1.5 py-0.5 rounded-full font-medium"
          >
            {sessionName}
          </FormFooterBadge>
        ))
      )}
    </div>
  );
}

/** Status cell — shared StatusBadge with the module config. */
export function renderStudentStatusCell({
  studentRow,
  statusBadgeConfig,
}: {
  studentRow: Student;
  statusBadgeConfig: StudentListTableProps["statusBadgeConfig"];
}): React.ReactNode {
  return <StatusBadge status={studentRow.status || "active"} config={statusBadgeConfig} />;
}
