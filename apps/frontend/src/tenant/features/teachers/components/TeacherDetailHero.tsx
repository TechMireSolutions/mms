import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { resolveTeacherStatus, type Teacher } from "@mms/shared";

interface TeacherDetailHeroProps {
  teacher: Teacher;
  displayName: string;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  showStatus: boolean;
}

export function TeacherDetailHero({
  teacher,
  displayName,
  statusConfig,
  showStatus,
}: TeacherDetailHeroProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
      <UserAvatar
        id={String(teacher.id)}
        name={displayName}
        className="w-16 h-16 rounded-2xl text-2xl font-bold flex-shrink-0 shadow-xs"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-foreground truncate leading-tight">{displayName}</h3>
        {showStatus && (
          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
            <StatusBadge status={resolveTeacherStatus(teacher.status)} config={statusConfig} />
          </div>
        )}
      </div>
    </div>
  );
}
