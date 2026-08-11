import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { resolveTeacherStatus, type Teacher } from "@mms/shared";

interface TeacherDetailHeroProps {
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
    <PersonDetailHeroCard id={String(teacher.id)} displayName={displayName} avatar={avatar}>
      {showStatus ? (
        <StatusBadge status={resolveTeacherStatus(teacher.status)} config={statusConfig} />
      ) : null}
    </PersonDetailHeroCard>
  );
}
