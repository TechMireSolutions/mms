import type { Teacher } from "@/lib/data/teachersData";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/ui/UserAvatar";
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
    <div className="flex gap-3 items-start ms-1">
      {showSelectColumn ? (
        <div className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectOne(teacherId)}
            aria-label={t("teachers.table.selectTeacher", { name: displayName })}
          />
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
        onClick={() => onView(teacher)}
        aria-label={`${t("teachers.list.viewDetails")} - ${displayName}`}
      >
        <UserAvatar
          id={teacherId}
          name={displayName}
          className={`w-11 h-11 rounded-2xl text-sm shadow-inner${
            reducedMotion ? "" : " group-hover:scale-105 transition-transform duration-200"
          }`}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {displayName}
          </h4>
          {teacher.employeeId ? (
            <p className="mt-0.5 text-xs font-semibold text-muted-foreground truncate">
              {teacher.employeeId}
            </p>
          ) : null}
        </div>
      </Button>
    </div>
  );
}
