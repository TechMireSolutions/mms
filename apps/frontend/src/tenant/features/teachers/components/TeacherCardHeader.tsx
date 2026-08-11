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
  isColumnVisible: (key: string) => boolean;
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

  return (
    <DirectoryCardHeader
      id={teacherId}
      displayName={displayName}
      avatar={teacher.avatar}
      isSelected={isSelected}
      onSelect={() => onSelectOne(teacherId)}
      selectAriaLabel={t("teachers.table.selectTeacher", { name: displayName })}
      onView={() => onView(teacher)}
      viewAriaLabel={`${t("teachers.list.viewDetails")} - ${displayName}`}
      reducedMotion={reducedMotion}
      subtitle={
        <DirectoryCardSubtitleStack>
          {isColumnVisible("employeeId") && teacher.employeeId ? (
            <FormFooterBadge
              tone="muted"
              className="mt-1 max-w-full px-1.5 py-0.5 rounded font-bold tracking-tight truncate self-start"
            >
              {teacher.employeeId}
            </FormFooterBadge>
          ) : null}
          {isColumnVisible("gender") ? (
            <PersonIdentityMeta gender={teacher.gender} className="font-semibold truncate" />
          ) : null}
        </DirectoryCardSubtitleStack>
      }
    />
  );
}
