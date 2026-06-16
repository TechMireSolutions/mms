import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Users, MapPin, Check, AlertTriangle } from "lucide-react";
import { calcAge, Student } from '@/lib/data/studentsData';
import { SESSIONS_DATA, Session } from '@/lib/data/sessionsData';
import { getCollection } from "../../lib/db";

const TYPE_COLORS: Record<string, string> = {
  "Hifz":            "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Qaidah":          "bg-blue-50 text-blue-700 border-blue-100",
  "Tajweed":         "bg-violet-50 text-violet-700 border-violet-100",
  "Islamic Studies": "bg-amber-50 text-amber-700 border-amber-100",
};

interface CapacityBarProps {
  enrolled: number;
  capacity: number;
}

/**
 * Renders capacity progression indicator bar.
 *
 * @param props - Component properties.
 * @param props.enrolled - Number of enrolled students.
 * @param props.capacity - Total capacity of the class/session.
 * @returns The CapacityBar component.
 */
function CapacityBar({ enrolled, capacity }: CapacityBarProps): React.ReactElement {
  const pct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
  const color = pct >= 100 ? "bg-destructive" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-1" aria-hidden="true">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

export interface FlatSession {
  id: string;
  classId?: string;
  name: string;
  type: string;
  teacher: string;
  room: string;
  time: string;
  days: string[];
  capacity: number;
  enrolled: number;
  ageMin: number;
  ageMax: number;
  gender: "male" | "female" | "any";
  baseFee: number;
  currency: string;
}

interface SessionSelectorProps {
  student?: Partial<Student> | null;
  selected?: FlatSession | null;
  onSelect: (session: FlatSession) => void;
}

type SessionStatus = "full" | "gender" | "age" | "ok";

/**
 * Component for selecting a session/class for a student.
 *
 * @param props - Component properties.
 * @param props.student - Current student being enrolled.
 * @param props.selected - Currently selected session.
 * @param props.onSelect - Callback when session is selected.
 * @returns The SessionSelector component.
 */
export default function SessionSelector({ student, selected, onSelect }: SessionSelectorProps): React.ReactElement {
  const [filter, setFilter] = useState<string>("all");
  const age = student ? calcAge(student.dob) : null;
  const [sessions] = useState<Session[]>(() => getCollection<Session>("sessions", SESSIONS_DATA));

  // Flatten and adapt the sessions database collection to match flat structure.
  const flatSessions = React.useMemo<FlatSession[]>(() => {
    const list: FlatSession[] = [];
    sessions.forEach((s) => {
      if (s.classes && s.classes.length > 0) {
        s.classes.forEach((c) => {
          list.push({
            id: s.id,
            classId: c.id,
            name: `${s.name} – ${c.name}`,
            type: s.type,
            teacher: c.teacherName,
            room: c.room || "TBD",
            time: s.timetable?.filter(t => t.location === c.room).map(t => `${t.startTime} – ${t.endTime}`).join(", ") || "09:00 – 11:00",
            days: s.timetable?.filter(t => t.location === c.room).map(t => t.day) || ["Mon", "Wed", "Fri"],
            capacity: c.capacity,
            enrolled: c.enrolled,
            ageMin: c.ageMin,
            ageMax: c.ageMax,
            gender: c.gender,
            baseFee: s.baseFee,
            currency: s.currency,
          });
        });
      } else {
        list.push({
          id: s.id,
          name: s.name,
          type: s.type,
          teacher: "TBD",
          room: "TBD",
          time: "TBD",
          days: [],
          capacity: 0,
          enrolled: 0,
          ageMin: 5,
          ageMax: 99,
          gender: "any",
          baseFee: s.baseFee,
          currency: s.currency,
        });
      }
    });
    return list;
  }, [sessions]);

  const types = ["all", ...Array.from(new Set(flatSessions.map((s) => s.type)))];

  const filtered = flatSessions.filter((s) => filter === "all" || s.type === filter);

  const getStatus = (s: FlatSession): SessionStatus => {
    if (s.enrolled >= s.capacity) return "full";
    if (student) {
      if (s.gender !== "any" && student.gender && s.gender !== student.gender) return "gender";
      if (age !== null && (age < s.ageMin || age > s.ageMax)) return "age";
    }
    return "ok";
  };

  return (
    <section className="space-y-4" aria-label="Session Selector">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter sessions by course type">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={filter === t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All types" : t}
          </button>
        ))}
      </div>

      {/* Session cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((s, i) => {
          const status = getStatus(s);
          const isSelected = selected?.id === s.id;
          const spotsLeft = s.capacity - s.enrolled;
          const disabled = status === "full";

          return (
            <motion.button
              key={s.classId ? `${s.id}-${s.classId}` : s.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !disabled && onSelect(s)}
              disabled={disabled}
              aria-label={`Select session: ${s.name}, spots left: ${spotsLeft}. ${status !== "ok" ? `Warning: incompatible ${status}` : ""}`}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-primary bg-primary/[0.04] shadow-sm"
                  : disabled
                  ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                  : status !== "ok"
                  ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[s.type] || "bg-muted text-muted-foreground border-border"}`}>
                      {s.type}
                    </span>
                    {status === "full" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">FULL</span>
                    )}
                    {status === "age" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Age
                      </span>
                    )}
                    {status === "gender" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Gender
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-foreground mt-1.5 truncate">{s.name}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="space-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{s.time} · {s.days.join(", ")}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{s.room} · {s.teacher}</div>
                <div className="flex items-center gap-1.5"><Users className="w-3 h-3" />
                  {status === "full"
                    ? `Full (${s.enrolled}/${s.capacity})`
                    : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left (${s.enrolled}/${s.capacity})`
                  }
                </div>
              </div>

              <CapacityBar enrolled={s.enrolled} capacity={s.capacity} />

              <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                <span className="text-[12px] font-bold text-foreground">
                  {s.currency} {s.baseFee.toLocaleString()}
                  <span className="text-muted-foreground font-normal"> / month</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Age {s.ageMin}–{s.ageMax} · {s.gender === "any" ? "Any gender" : s.gender}</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
