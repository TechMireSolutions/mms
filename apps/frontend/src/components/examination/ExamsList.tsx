import React from "react";
import { motion } from "framer-motion";
import { Edit2, BookOpen, Calendar, Clock, Users, CheckCircle, AlertCircle, Circle } from "lucide-react";
import { CLASSES, Exam } from '@/lib/data/examinationData';
import { formatDate } from "../../lib/db";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  upcoming:  { label: "Upcoming",  cls: "bg-info/10 text-info border-info/20",    icon: Circle },
  ongoing:   { label: "Ongoing",   cls: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  completed: { label: "Completed", cls: "bg-success/10 text-success border-success/20", icon: CheckCircle },
};

interface ExamsListProps {
  exams: Exam[];
  onNew: () => void;
  onEdit: (exam: Exam) => void;
}

/**
 * Renders the dashboard list of created exams.
 *
 * @param props - Component props.
 * @param props.exams - Array of exam records.
 * @param props.onNew - Callback to add a new exam.
 * @param props.onEdit - Callback to edit an exam card details.
 * @returns The ExamsList component.
 */
export default function ExamsList({ exams, onNew, onEdit }: ExamsListProps): React.ReactElement {
  return (
    <section className="space-y-4" aria-label="Examinations list page">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground" role="status">{exams.length} exam{exams.length !== 1 ? "s" : ""}</p>
      </div>

      {exams.length === 0 && (
        <div className="py-16 text-center rounded-xl border-2 border-dashed border-border" role="status">
          <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">No exams yet</p>
          <p className="text-xs text-muted-foreground mt-1">Click "New Exam" to create one</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="Examinations list">
        {exams.map((exam, i) => {
          const cfg = STATUS_CONFIG[exam.status] || STATUS_CONFIG.upcoming;
          const StatusIcon = cfg.icon;
          const assignedClasses = CLASSES.filter((c) => exam.classIds.includes(c.id));
          const studentCount = assignedClasses.reduce((s, c) => s + c.students.length, 0);

          return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all group"
              role="listitem"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.cls} flex items-center gap-1`}>
                      <StatusIcon className="w-2.5 h-2.5" /> {cfg.label}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">{exam.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{exam.subject}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(exam)}
                  aria-label={`Edit exam details: ${exam.name}`}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                >
                  <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              {exam.description && (
                <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{exam.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                {[
                  { icon: Calendar, label: formatDate(exam.date, true) },
                  { icon: Clock, label: `${exam.duration} min` },
                  { icon: Users, label: `${studentCount} students` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-lg bg-muted/40 px-2 py-1.5 flex items-center gap-1.5">
                    <Icon className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-foreground truncate">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5" role="list" aria-label="Assigned classes">
                {assignedClasses.map((cls) => (
                  <span key={cls.id} className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full" role="listitem">
                    {cls.name}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Total Marks: <strong className="text-foreground">{exam.totalMarks}</strong></span>
                <span>Pass: <strong className="text-foreground">{exam.passingMarks}</strong></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
