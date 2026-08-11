import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { BookOpen } from "lucide-react";
import { formatMoney, sessionTypeI18nKey, type Session } from "@mms/shared";

interface StudentDetailSessionsSectionProps {
  sessions: Session[];
  loading?: boolean;
  error?: boolean;
}

export function StudentDetailSessionsSection({
  sessions,
  loading,
  error,
}: StudentDetailSessionsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const emptyDash = t("students.table.emptyDash");

  if (loading) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("students.detail.enrolledSessions", { count: 0 })}</DetailSectionTitle>
        <div className="space-y-2.5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("students.detail.enrolledSessions", { count: sessions.length })}</DetailSectionTitle>
        <ErrorState
          compact
          title={t("students.loadFailed")}
          description={t("students.loadFailedHint")}
        />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <DetailSectionTitle>{t("students.detail.enrolledSessions", { count: sessions.length })}</DetailSectionTitle>
        <EmptyState
          compact
          icon={BookOpen}
          title={t("students.detail.notEnrolled")}
          description={t("students.detail.notEnrolledDesc")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DetailSectionTitle>{t("students.detail.enrolledSessions", { count: sessions.length })}</DetailSectionTitle>
      <div className="space-y-2.5">
        {sessions.map((session) => {
          const typeKey = sessionTypeI18nKey(session.type);
          const typeLabel = typeKey ? t(typeKey) : t("sessions.types.other");
          return (
            <Card
              key={session.id}
              accentColor="primary"
              className="p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between ms-1">
                <FormFooterBadge tone="primary" className="px-1.5 py-0.5 rounded-full font-bold uppercase">
                  {typeLabel}
                </FormFooterBadge>
                <span className="text-xs font-bold text-muted-foreground">
                  {t("students.detail.sessionFee", { amount: formatMoney(session.baseFee ?? 0, session.currency) })}
                </span>
              </div>
              <h5 className="text-xs font-bold text-foreground ms-1">{session.name}</h5>
              {session.classes && session.classes.length > 0 ? (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg ms-1">
                  <SectionLabel as="p" weight="bold" tracking="wider" toneClassName="text-muted-foreground/60">
                    {t("students.detail.classAssignments")}
                  </SectionLabel>
                  {session.classes.map((sessionClass) => (
                    <div key={sessionClass.id} className="flex justify-between gap-1.5">
                      <span className="font-medium text-foreground">{t("students.detail.classByTeacher", { name: sessionClass.name ?? "", teacher: sessionClass.teacherName ?? "" })}</span>
                      <span>{t("students.detail.classRoom", { room: sessionClass.room || emptyDash })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic ms-1">{t("students.detail.noClassesConfigured")}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
