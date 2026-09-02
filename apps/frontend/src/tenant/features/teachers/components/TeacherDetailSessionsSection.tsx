import React from "react";
import { BookOpen, School, Users, DoorOpen } from "lucide-react";
import { sessionTypeI18nKey } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import type { TeacherAssignedClassItem } from "@/lib/teachers/teacherAssignment";

export interface TeacherDetailSessionsSectionProps {
  assignedClasses: TeacherAssignedClassItem[];
  loading?: boolean;
  error?: boolean;
}

export function TeacherDetailSessionsSection({
  assignedClasses,
  loading,
  error,
}: TeacherDetailSessionsSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("teachers.detail.assignedClasses")}</DetailSectionTitle>
        <div className="space-y-2.5">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("teachers.detail.assignedClasses")}</DetailSectionTitle>
        <ErrorState
          compact
          title={t("teachers.loadFailed")}
          description={t("teachers.loadFailedHint")}
        />
      </div>
    );
  }

  if (assignedClasses.length === 0) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("teachers.detail.assignedClasses")}</DetailSectionTitle>
        <EmptyState
          compact
          icon={School}
          title={t("teachers.detail.noAssignedClasses")}
          description={t("teachers.empty.subtitle")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <DetailSectionTitle>{t("teachers.detail.assignedClasses")}</DetailSectionTitle>
        <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted/60">
          {assignedClasses.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {assignedClasses.map((item) => {
          const typeKey = item.sessionType ? sessionTypeI18nKey(item.sessionType) : null;
          const typeLabel = typeKey ? t(typeKey) : (item.sessionType || "");

          return (
            <Card
              key={`${item.sessionId}-${item.classId}`}
              accentColor="primary"
              className="p-3.5 space-y-2.5 bg-card hover:bg-card/90 transition-colors border-border/70"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <BookOpen className="w-4 h-4 text-primary shrink-0" aria-hidden />
                  <h5 className="text-sm font-bold text-foreground truncate">
                    {item.className}
                  </h5>
                </div>
                {typeLabel ? (
                  <FormFooterBadge tone="primary" className="px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider shrink-0">
                    {typeLabel}
                  </FormFooterBadge>
                ) : null}
              </div>

              <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl space-y-1.5 border border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground/90 truncate">
                    {item.sessionName}
                  </span>
                  {item.sessionStatus && (
                    <span className="text-2xs uppercase font-bold text-muted-foreground tracking-wider">
                      {item.sessionStatus}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-3xs text-muted-foreground border-t border-border/40">
                  {item.room ? (
                    <div className="flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5 text-primary/70" aria-hidden />
                      <span>{t("teachers.detail.room", { room: item.room })}</span>
                    </div>
                  ) : null}

                  {item.enrolled != null ? (
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary/70" aria-hidden />
                      <span>{t("teachers.detail.enrolledCount", { count: item.enrolled })}</span>
                      {item.capacity ? (
                        <span className="text-muted-foreground/60">
                          ({t("teachers.detail.capacity", { capacity: item.capacity })})
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
