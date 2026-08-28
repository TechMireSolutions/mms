import type { Student } from "@mms/shared";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { useTranslation } from "@/hooks/useTranslation";

export interface StudentCardHeaderProps {
  student: Student;
  studentId?: string;
  isSelected: boolean;
  displayName?: string;
  onSelectOne: (id: string) => void;
  onViewStudent: (student: Student) => void;
  isColumnVisible?: (key: string) => boolean;
  reducedMotion?: boolean;
}

/** Contacts-shaped horizontal card header: checkbox | avatar + student name (with father & mother below). */
export function StudentCardHeader({
  student,
  studentId,
  isSelected,
  displayName,
  onSelectOne,
  onViewStudent,
  isColumnVisible,
  reducedMotion = false,
}: StudentCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();
  const id = studentId ?? String(student.id);
  const studentName = student.name?.trim() || displayName || "";
  const fatherName = student.fatherName?.trim();
  const motherName = student.motherName?.trim();
  const guardianName = student.guardianName?.trim();

  const showParents = !isColumnVisible || isColumnVisible("parents");
  const showGender = !isColumnVisible || isColumnVisible("gender");
  const effectiveGender = showGender ? student.gender : undefined;

  const hasParentSubtitle = showParents && Boolean(fatherName || motherName || guardianName);
  const subtitle = hasParentSubtitle ? (
    <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
      {fatherName ? (
        <p className="truncate" title={fatherName}>
          <span className="text-muted-foreground/70">{t("students.detail.father")}:</span> {fatherName}
        </p>
      ) : null}
      {motherName ? (
        <p className="truncate" title={motherName}>
          <span className="text-muted-foreground/70">{t("students.detail.mother")}:</span> {motherName}
        </p>
      ) : null}
      {!fatherName && !motherName && guardianName ? (
        <p className="truncate" title={guardianName}>
          <span className="text-muted-foreground/70">{t("students.idCard.guardian")}:</span> {guardianName}
        </p>
      ) : null}
    </div>
  ) : undefined;

  return (
    <DirectoryCardHeader
      id={id}
      displayName={studentName}
      avatar={typeof student.avatar === "string" ? student.avatar : undefined}
      gender={effectiveGender}
      isSelected={isSelected}
      onSelect={() => onSelectOne(id)}
      selectAriaLabel={t("students.table.selectStudent", { name: studentName })}
      onView={() => onViewStudent(student)}
      viewAriaLabel={`${t("students.list.viewProfile")} - ${studentName}`}
      subtitle={subtitle}
      reducedMotion={reducedMotion}
    />
  );
}

