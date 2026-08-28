import React from "react";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { getGenderCardAccent } from "@/lib/genderUi";
import type { Student } from "@mms/shared";

export interface StudentDetailHeroProps {
  student: Student;
  statusBadgeConfig: Record<string, StatusBadgeConfigItem>;
}

export function StudentDetailHero({ student, statusBadgeConfig }: StudentDetailHeroProps): React.JSX.Element {
  const displayName = student.name?.trim() || "";
  const avatarUrl = typeof student.avatar === "string" ? student.avatar : undefined;

  return (
    <PersonDetailHeroCard
      id={String(student.id)}
      displayName={displayName}
      avatar={avatarUrl}
      gender={student.gender}
      accentColor={getGenderCardAccent(student.gender)}
    >
      <StatusBadge status={student.status || "active"} config={statusBadgeConfig} />
      {student.grNumber ? <GrBadge grNumber={student.grNumber} /> : null}
    </PersonDetailHeroCard>
  );
}
