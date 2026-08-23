import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { getGenderCardAccent } from "@/lib/genderUi";
import type { Student } from "@mms/shared";

interface StudentDetailHeroProps {
  student: Student;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
}

export function StudentDetailHero({ student, statusBadgeConfig }: StudentDetailHeroProps): React.JSX.Element {
  return (
    <PersonDetailHeroCard
      id={String(student.id)}
      displayName={student.name || ""}
      avatar={student.avatar as string | null | undefined}
      accentColor={getGenderCardAccent(student.gender)}
    >
      <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
      <GrBadge grNumber={student.grNumber} />
    </PersonDetailHeroCard>
  );
}
