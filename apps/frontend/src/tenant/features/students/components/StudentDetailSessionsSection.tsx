import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { BookOpen } from "lucide-react";
import { formatMoney, type Session } from "@mms/shared";

interface StudentDetailSessionsSectionProps {
  sessions: Session[];
}

export function StudentDetailSessionsSection({ sessions }: StudentDetailSessionsSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h4 className={`${DETAIL_SECTION_TITLE} ps-1`}>{t("students.detail.enrolledSessions", { count: sessions.length })}</h4>
      {sessions.length === 0 ? (
        <EmptyState
          compact
          icon={BookOpen}
          title={t("students.detail.notEnrolled")}
          description={t("students.detail.notEnrolledDesc")}
        />
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session) => (
            <Card
              key={session.id}
              accentColor="primary"
              className="p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between ms-1">
                <span className="bg-primary/5 text-primary border border-primary/10 text-xs px-1.5 py-0.5 rounded-full font-bold uppercase">
                  {session.type}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {t("students.detail.sessionFee", { amount: formatMoney(session.baseFee ?? 0, session.currency) })}
                </span>
              </div>
              <h5 className="text-xs font-bold text-foreground ms-1">{session.name}</h5>
              {session.classes && session.classes.length > 0 ? (
                <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2 rounded-lg ms-1">
                  <p className="font-semibold uppercase tracking-wider text-xs text-muted-foreground/80">{t("students.detail.classAssignments")}</p>
                  {session.classes.map((sessionClass) => (
                    <div key={sessionClass.id} className="flex justify-between gap-1.5">
                      <span className="font-medium text-foreground">{t("students.detail.classByTeacher", { name: sessionClass.name ?? "", teacher: sessionClass.teacherName ?? "" })}</span>
                      <span>{t("students.detail.classRoom", { room: sessionClass.room || "—" })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic ms-1">{t("students.detail.noClassesConfigured")}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
