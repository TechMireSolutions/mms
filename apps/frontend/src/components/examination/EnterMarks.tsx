import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle2, Users } from "lucide-react";
import { CLASSES, STUDENTS, Exam, ExamResult } from '@/lib/data/examinationData';
import { getGrade } from "./gradeUtils";

interface EnterMarksProps {
  exams: Exam[];
  results: ExamResult[];
  onSaveResults: (examId: string, results: ExamResult[]) => void;
}

/**
 * Interface where admin or teachers enter student scores for exams.
 *
 * @param props - Component props.
 * @param props.exams - Configured exam sessions.
 * @param props.results - Scoring result submissions.
 * @param props.onSaveResults - Callback to save scoring entries.
 * @returns The EnterMarks component.
 */
export default function EnterMarks({ exams, results, onSaveResults }: EnterMarksProps): React.ReactElement {
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [marks, setMarks] = useState<Record<string, number | string>>({});
  const [saved, setSaved] = useState<boolean>(false);

  const exam = exams.find((e) => e.id === selectedExam);

  const students = useMemo(() => {
    if (!exam) return [];
    return STUDENTS.filter((s) => exam.classIds.includes(s.classId));
  }, [exam]);

  // Pre-fill from existing results using useEffect to avoid state-setting side effects in render/memo
  React.useEffect(() => {
    if (!exam) return;
    const pre: Record<string, number | string> = {};
    results.filter((r) => r.examId === exam.id).forEach((r) => {
      pre[r.studentId] = r.marksObtained;
    });
    setMarks(pre);
    setSaved(false);
  }, [selectedExam, exam, results]);

  const handleSave = () => {
    if (!exam) return;
    const newResults: ExamResult[] = students.map((s) => ({
      id: `er_${exam.id}_${s.id}`,
      examId: exam.id,
      studentId: s.id,
      marksObtained: Number(marks[s.id] || 0),
    }));
    onSaveResults(exam.id, newResults);
    setSaved(true);
  };

  return (
    <section className="space-y-5" aria-labelledby="enter-marks-title">
      {/* Exam selector */}
      <div>
        <span id="enter-marks-title" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Select Exam</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select exam to mark">
          {exams.map((e) => {
            const isSelected = selectedExam === e.id;
            return (
              <button
                key={e.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => { setSelectedExam(e.id); setSaved(false); }}
                className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {e.name}
              </button>
            );
          })}
        </div>
      </div>

      {exam && (
        <>
          {/* Exam info */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-4 text-[12px]" role="status" aria-label="Exam details brief">
            <span><strong className="text-foreground">{exam.subject}</strong></span>
            <span className="text-muted-foreground">Total: <strong className="text-foreground">{exam.totalMarks}</strong></span>
            <span className="text-muted-foreground">Passing: <strong className="text-foreground">{exam.passingMarks}</strong></span>
            <span className="text-muted-foreground">Students: <strong className="text-foreground">{students.length}</strong></span>
          </div>

          {/* Marks entry table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 className="text-[13px] font-bold text-foreground">Enter Marks</h3>
            </div>
            <div className="divide-y divide-border/50" role="list">
              {students.map((s, i) => {
                const cls = CLASSES.find((c) => c.id === s.classId);
                const val = marks[s.id] ?? "";
                const pct = exam.totalMarks > 0 && val !== "" ? Math.round((Number(val) / exam.totalMarks) * 100) : null;
                const gr = pct !== null ? getGrade(pct) : null;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3"
                    role="listitem"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary" aria-hidden="true">
                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{cls?.name} · {s.rollNo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {gr && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ color: gr.color, background: gr.bg }} role="status">
                          {gr.label} · {pct}%
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={exam.totalMarks}
                          value={val}
                          aria-label={`Marks for ${s.name}`}
                          onChange={(e) => { setMarks((m) => ({ ...m, [s.id]: e.target.value })); setSaved(false); }}
                          className="w-20 px-2 py-1.5 rounded-lg border border-border text-sm text-center font-semibold bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="—"
                        />
                        <span className="text-[11px] text-muted-foreground" aria-hidden="true">/ {exam.totalMarks}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            {saved ? (
              <div className="flex items-center gap-2 text-success text-sm font-semibold" role="status">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Marks saved!
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
              >
                <Save className="w-4 h-4" aria-hidden="true" /> Save Marks
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
