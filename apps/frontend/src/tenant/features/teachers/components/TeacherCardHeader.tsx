import type { Teacher } from '@mms/shared';
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { useTranslation } from "@/hooks/useTranslation";

export interface TeacherCardHeaderProps {
  teacher: Teacher;
  teacherId: string;
  isSelected: boolean;
  displayName: string;
  showSelectColumn: boolean;
  onSelectOne: (id: string) => void;
  onView: (teacher: Teacher) => void;
  reducedMotion?: boolean;
}

/** Contacts-shaped horizontal card header: checkbox | avatar + name + employee id. */
export function TeacherCardHeader({
  teacher,
  teacherId,
  isSelected,
  displayName,
  showSelectColumn,
  onSelectOne,
  onView,
  reducedMotion = false,
}: TeacherCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardHeader
      id={teacherId}
      displayName={displayName}
      isSelected={isSelected}
      showSelect={showSelectColumn}
      onSelect={() => onSelectOne(teacherId)}
      selectAriaLabel={t("teachers.table.selectTeacher", { name: displayName })}
      onView={() => onView(teacher)}
      viewAriaLabel={`${t("teachers.list.viewDetails")} - ${displayName}`}
      reducedMotion={reducedMotion}
      subtitle={
        teacher.employeeId ? (
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground truncate">
            {teacher.employeeId}
          </p>
        ) : undefined
      }
    />
  );
}
