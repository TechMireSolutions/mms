import type { Student } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";

export interface StudentCardHeaderProps {
  student: Student;
  studentId: string;
  isSelected: boolean;
  displayName: string;
  onSelectOne: (id: string) => void;
  onViewStudent: (student: Student) => void;
  reducedMotion?: boolean;
}

/** Contacts-shaped horizontal card header: checkbox | avatar + name + GR. */
export function StudentCardHeader({
  student,
  studentId,
  isSelected,
  displayName,
  onSelectOne,
  onViewStudent,
  reducedMotion = false,
}: StudentCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 items-start ms-1">
      <div className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectOne(studentId)}
          aria-label={t("students.table.selectStudent", { name: displayName })}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
        onClick={() => onViewStudent(student)}
        aria-label={`${t("students.list.viewProfile")} - ${displayName}`}
      >
        <UserAvatar
          id={studentId}
          name={displayName}
          avatar={typeof student.avatar === "string" ? student.avatar : undefined}
          className={`w-11 h-11 rounded-2xl text-sm shadow-inner${
            reducedMotion ? "" : " group-hover:scale-105 transition-transform duration-200"
          }`}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {displayName}
          </h4>
          <GrBadge grNumber={student.grNumber} className="mt-0.5" />
        </div>
      </Button>
    </div>
  );
}
