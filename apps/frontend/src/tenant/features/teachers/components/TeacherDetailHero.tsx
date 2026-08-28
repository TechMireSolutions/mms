import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { EmployeeIdBadge } from "@/tenant/features/teachers/components/EmployeeIdBadge";
import { getGenderCardAccent } from "@/lib/genderUi";
import { resolveTeacherStatus, type Teacher } from "@mms/shared";

export interface TeacherDetailHeroProps {
  teacher: Teacher;
  displayName: string;
  avatar?: string | null;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  showStatus: boolean;
}

export function TeacherDetailHero({
  teacher,
  displayName,
  avatar,
  statusConfig,
  showStatus,
}: TeacherDetailHeroProps): React.JSX.Element {
  return (
    <PersonDetailHeroCard
      id={String(teacher.id)}
      displayName={displayName}
      avatar={avatar}
      gender={teacher.gender}
      accentColor={getGenderCardAccent(teacher.gender)}
    >
      {showStatus ? (
        <StatusBadge status={resolveTeacherStatus(teacher.status)} config={statusConfig} />
      ) : null}
      <EmployeeIdBadge employeeId={teacher.employeeId} />
    </PersonDetailHeroCard>
  );
}
