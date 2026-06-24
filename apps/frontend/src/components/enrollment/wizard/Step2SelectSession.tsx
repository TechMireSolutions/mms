import React, { useMemo } from "react";
import { BookOpen, Calendar, Users, DollarSign } from "lucide-react";
import { Session } from '@/lib/data/sessionsData';
import { SEMANTIC_BADGE, WIZARD_SELECTION_DOT } from "@/lib/semanticTone";
import StatusBadge, { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import useTranslation from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

/**
 * Format a date string to a localized PK date.
 *
 * @param date - Date string to format.
 * @returns Formatted date.
 */
function fmt(date?: string): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

interface Step2SelectSessionProps {
  value: Session | null | undefined;
  onChange: (session: Session) => void;
  sessions?: Session[];
}

/**
 * Step 2 component for selecting a session.
 *
 * @param props - Component props.
 * @param props.value - Selected session object.
 * @param props.onChange - Callback when session selection changes.
 * @param props.sessions - Dynamic list of active/inactive sessions.
 * @returns The Step2SelectSession component.
 */
export default function Step2SelectSession({ value, onChange, sessions = [] }: Step2SelectSessionProps): React.ReactElement {
  const { t } = useTranslation();
  const sessionStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      full: { label: t("enrollment.session.full"), cls: SEMANTIC_BADGE.destructiveStrong },
      almost_full: { label: t("enrollment.session.almostFull"), cls: SEMANTIC_BADGE.warningStrong },
    }),
    [t],
  );
  const activeSessions = sessions.filter((s) => s.status === "active");

  return (
    <section className="space-y-4" aria-labelledby="step2-title">
      <div>
        <h3 id="step2-title" className="text-base font-bold text-foreground">Select Session</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Choose from active sessions only.</p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Active sessions list">
        {activeSessions.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm" role="status">No active sessions found</div>
        )}
        {activeSessions.map((session) => {
          const selected = value?.id === session.id;
          const totalSpots = (session.classes || []).reduce((sum, c) => sum + c.capacity, 0);
          const totalEnrolled = (session.classes || []).reduce((sum, c) => sum + c.enrolled, 0);
          const spotsLeft = totalSpots - totalEnrolled;
          const isFull = spotsLeft <= 0;

          return (
            <Button
              key={session.id}
              role="radio"
              aria-checked={selected}
              disabled={isFull}
              onClick={() => !isFull && onChange(session)}
              variant="outline"
              className={`w-full text-left p-4 rounded-xl border-2 transition-all h-auto disabled:opacity-50 disabled:cursor-not-allowed justify-start hover:bg-transparent ${
                selected ? "border-primary bg-primary/5 hover:bg-primary/5 text-foreground hover:text-foreground" : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground">{session.name}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{session.type}</span>
                    {isFull && <StatusBadge status="full" config={sessionStatusConfig} size="sm" />}
                    {!isFull && spotsLeft <= 5 && <StatusBadge status="almost_full" config={sessionStatusConfig} size="sm" />}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      <span>{fmt(session.startDate)} – {fmt(session.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                      <DollarSign className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      PKR {session.baseFee?.toLocaleString()}
                    </div>
                  </div>
                  {session.classes && session.classes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {session.classes.map((c) => (
                        <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {c.name} ({c.capacity - c.enrolled} spots)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {selected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <div className={`h-2 w-2 rounded-full ${WIZARD_SELECTION_DOT}`} />
                  </div>
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
