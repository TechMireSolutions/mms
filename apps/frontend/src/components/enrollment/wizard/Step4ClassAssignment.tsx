import React, { useState } from "react";
import { Layers, AlertTriangle, Users, CheckCircle2 } from "lucide-react";
import { Session, Class } from '@/lib/data/sessionsData';
import { Student } from '@/lib/data/studentsData';
import { Button } from "@/components/ui/button";

interface Step4ClassAssignmentProps {
  session: Session | null | undefined;
  student: Student | null | undefined;
  suggestedClass: Class | null | undefined;
  value: Class | null | undefined;
  onChange: (cls: Class) => void;
}

/**
 * Step 4 component for selecting a class within a session.
 *
 * @param props - Component props.
 * @param props.session - Selected session.
 * @param props.student - Current student.
 * @param props.suggestedClass - Auto-suggested class match.
 * @param props.value - Selected class.
 * @param props.onChange - Callback on class selection change.
 * @returns The Step4ClassAssignment component.
 */
export default function Step4ClassAssignment({ session, student, suggestedClass, value, onChange }: Step4ClassAssignmentProps): React.ReactElement {
  const [override, setOverride] = useState<boolean>(false);
  const classes = session?.classes || [];

  const handleSelect = (cls: Class) => {
    const isOverride = suggestedClass && cls.id !== suggestedClass.id;
    setOverride(!!isOverride);
    onChange(cls);
  };

  return (
    <section className="space-y-4" aria-labelledby="step4-title">
      <div>
        <h3 id="step4-title" className="text-base font-bold text-foreground">Class Assignment</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Select a class within <strong>{session?.name}</strong>.</p>
      </div>

      {/* Auto-suggestion banner */}
      {suggestedClass && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20" role="status">
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Auto-suggested: <span className="text-primary">{suggestedClass.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Best match based on student age, gender, and available capacity.
            </p>
          </div>
        </div>
      )}

      {!suggestedClass && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm" role="status">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          No auto-match found. Manually select a class below.
        </div>
      )}

      {/* Override warning */}
      {override && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm font-semibold" role="alert">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          Manual override — selected class differs from auto-suggestion. Confirm this is intentional.
        </div>
      )}

      {/* Class list */}
      <div className="space-y-2" role="radiogroup" aria-label="Available classes list">
        {classes.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground" role="status">
            <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" aria-hidden="true" />
            No eligible classes found for this session.
          </div>
        )}
        {classes.map((cls) => {
          const selected   = value?.id === cls.id;
          const isSuggested = suggestedClass?.id === cls.id;
          const spotsLeft  = cls.capacity - cls.enrolled;
          const full       = spotsLeft <= 0;

          return (
            <Button
              key={cls.id}
              role="radio"
              aria-checked={selected}
              disabled={full}
              onClick={() => !full && handleSelect(cls)}
              variant="outline"
              className={`w-full text-left p-4 rounded-xl border-2 transition-all h-auto disabled:opacity-50 disabled:cursor-not-allowed justify-start hover:bg-transparent ${
                selected ? "border-primary bg-primary/5 hover:bg-primary/5 text-foreground hover:text-foreground" : "border-border bg-card hover:border-primary/40 hover:bg-muted/30 text-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{cls.name}</p>
                      {isSuggested && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Recommended</span>}
                      {full && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">Full</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>Age {cls.ageMin}–{cls.ageMax}</span>
                      <span className="capitalize">{cls.gender}</span>
                      <span>{cls.teacherName}</span>
                      {cls.room && <span>{cls.room}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0" aria-hidden="true">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{cls.enrolled}/{cls.capacity}</span>
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-muted mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${spotsLeft <= 3 ? "bg-destructive" : spotsLeft <= 7 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{spotsLeft} left</p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
