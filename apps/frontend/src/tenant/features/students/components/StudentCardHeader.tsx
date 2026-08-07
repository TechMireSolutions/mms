import type { Student } from "@mms/shared";
import {
  DirectoryCardSubtitleStack,
  PersonIdentityMeta,
} from "@/components/ui/PersonIdentityMeta";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";

export interface StudentCardHeaderProps {
  student: Student;
  studentId: string;
  isSelected: boolean;
  displayName: string;
  showGender?: boolean;
  onSelectOne: (id: string) => void;
  onViewStudent: (student: Student) => void;
  reducedMotion?: boolean;
}

/** Contacts-shaped horizontal card header: checkbox | avatar + name + GR/gender. */
export function StudentCardHeader({
  student,
  studentId,
  isSelected,
  displayName,
  showGender = false,
  onSelectOne,
  onViewStudent,
  reducedMotion = false,
}: StudentCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardHeader
      id={studentId}
      displayName={displayName}
      avatar={typeof student.avatar === "string" ? student.avatar : undefined}
      isSelected={isSelected}
      onSelect={() => onSelectOne(studentId)}
      selectAriaLabel={t("students.table.selectStudent", { name: displayName })}
      onView={() => onViewStudent(student)}
      viewAriaLabel={`${t("students.list.viewProfile")} - ${displayName}`}
      reducedMotion={reducedMotion}
      subtitle={
        <DirectoryCardSubtitleStack>
          <GrBadge grNumber={student.grNumber} />
          {showGender ? (
            <PersonIdentityMeta gender={student.gender} className="font-semibold truncate" />
          ) : null}
        </DirectoryCardSubtitleStack>
      }
    />
  );
}
