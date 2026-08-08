import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import type { Student } from "@mms/shared";

interface StudentDetailHeroProps {
  student: Student;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
}

export function StudentDetailHero({ student, statusBadgeConfig }: StudentDetailHeroProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
      <UserAvatar id={String(student.id)} name={student.name || ""} className="w-16 h-16 rounded-2xl text-2xl font-bold flex-shrink-0 shadow-xs" />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-foreground truncate leading-tight">{student.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-2 items-center">
          <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
          <GrBadge grNumber={student.grNumber} />
        </div>
      </div>
    </div>
  );
}
