import type { Teacher } from '@mms/shared';
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";
import {
  DirectoryCardSubtitleStack,
  PersonIdentityMeta,
} from "@/components/ui/PersonIdentityMeta";
import { useTranslation } from "@/hooks/useTranslation";

export interface TeacherCardHeaderProps {
  teacher: Teacher;
  teacherId: string;
  isSelected: boolean;
  displayName: string;
  /** Column-visibility gate — employees show employee id / gender like Students gates GR/gender on cards. */
  isColumnVisible?: (key: string) => boolean;
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
  isColumnVisible,
  onSelectOne,
  onView,
  reducedMotion = false,
}: TeacherCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  const showEmployeeId = (!isColumnVisible || isColumnVisible("employeeId")) && Boolean(teacher.employeeId);
  const showGender = (!isColumnVisible || isColumnVisible("gender")) && Boolean(teacher.gender);
  const effectiveGender = showGender ? teacher.gender : undefined;

  const hasSubtitle = showEmployeeId || showGender || Boolean(teacher.designation);
  const subtitle = hasSubtitle ? (
    <DirectoryCardSubtitleStack>
      <div className="flex items-center gap-1.5 flex-wrap">
        {showEmployeeId && teacher.employeeId ? (
          <FormFooterBadge
            tone="muted"
            className="mt-1 max-w-full px-1.5 py-0.5 rounded font-bold tracking-tight truncate self-start"
            title={teacher.employeeId}
          >
            {teacher.employeeId}
          </FormFooterBadge>
        ) : null}
        {teacher.designation ? (
          <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 truncate">
            {teacher.designation}
          </span>
        ) : null}
      </div>
      {showGender && teacher.gender ? (
        <PersonIdentityMeta gender={teacher.gender} className="font-semibold truncate" />
      ) : null}
    </DirectoryCardSubtitleStack>
  ) : undefined;

  return (
    <DirectoryCardHeader
      id={teacherId}
      displayName={displayName}
      avatar={teacher.avatar}
      gender={effectiveGender}
      isSelected={isSelected}
      onSelect={() => onSelectOne(teacherId)}
      selectAriaLabel={t("teachers.table.selectTeacher", { name: displayName })}
      onView={() => onView(teacher)}
      viewAriaLabel={`${t("teachers.list.viewDetails")} - ${displayName}`}
      reducedMotion={reducedMotion}
      subtitle={subtitle}
    />
  );
}

export type FacultyCardHeaderProps = TeacherCardHeaderProps;
export const FacultyCardHeader = TeacherCardHeader;

