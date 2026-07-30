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
    <div className="relative overflow-hidden group/hero flex items-center gap-4 p-4 rounded-2xl bg-muted/35 border border-border/50 shadow-sm transition-all duration-200">
      <UserAvatar id={String(student.id)} name={student.name || ""} className="w-14 h-14 rounded-2xl text-xl font-bold flex-shrink-0 shadow-sm" />
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
