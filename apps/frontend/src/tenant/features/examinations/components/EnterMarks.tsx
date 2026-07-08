import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Save, CheckCircle2, Users } from "lucide-react";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useStudentsByIds } from "@/tenant/features/students/hooks/useStudents";
import type { Student } from "@/lib/data/studentsData";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { useEnrollmentsCollection } from "@/tenant/features/enrollments/hooks/useEnrollmentsApi";
import { getGrade } from "@/tenant/features/examinations/components/gradeUtils";
import { FORM_INPUT_COMPACT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
export function EnterMarks({ exams, results, onSaveResults }: EnterMarksProps): React.ReactElement {
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [marks, setMarks] = useState<Record<string, number | string>>({});
  const [saved, setSaved] = useState<boolean>(false);

  const exam = exams.find((examOption) => examOption.id === selectedExam);

  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();
  const classNamesById = useMemo(
    () => new Map(
      sessions.flatMap((session) =>
        (session.classes || []).map((sessionClass) => [sessionClass.id, `${session.name} - ${sessionClass.name}`] as const),
      ),
    ),
    [sessions],
  );

  const studentIds = useMemo(() => {
    if (!exam) return [];
    const classIds = new Set(exam.classIds);
    return uniqueRegistryIds(
      enrollments.filter((enrollment) => classIds.has(enrollment.classId)).map((enrollment) => enrollment.studentId),
    );
  }, [exam, enrollments]);

  const { data: resolvedStudents = [] } = useStudentsByIds(studentIds);

  const students = useMemo((): Array<Student & { classId: string; rollNo: string }> => {
    if (!exam) return [];
    const classIds = new Set(exam.classIds);
    const enrollmentByStudent = new Map(
      enrollments
         .filter((enrollment) => classIds.has(enrollment.classId))
         .map((enrollment) => [String(enrollment.studentId), enrollment]),
    );
    return resolvedStudents
      .filter((student) => enrollmentByStudent.has(String(student.id)))
      .map((student) => {
        const enrollment = enrollmentByStudent.get(String(student.id))!;
        return {
          ...student,
          classId: enrollment.classId,
          rollNo: student.grNumber ?? "",
        };
      });
  }, [exam, resolvedStudents, enrollments]);

  // Pre-fill from existing results using useEffect to avoid state-setting side effects in render/memo
  React.useEffect(() => {
    if (!exam) return;
    const prefilledMarks: Record<string, number | string> = {};
    results.filter((examResult) => examResult.examId === exam.id).forEach((examResult) => {
      prefilledMarks[examResult.studentId] = examResult.marksObtained;
    });
    setMarks(prefilledMarks);
    setSaved(false);
  }, [selectedExam, exam, results]);

  const handleSave = () => {
    if (!exam) return;
    const newResults: ExamResult[] = students.map((student) => ({
      id: `er_${exam.id}_${student.id}`,
      examId: exam.id,
      studentId: String(student.id),
      marksObtained: Number(marks[String(student.id)] || 0),
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
          {exams.map((examOption) => {
            const isSelected = selectedExam === examOption.id;
            return (
              <Button
                key={examOption.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => { setSelectedExam(examOption.id); setSaved(false); }}
                className={`px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {examOption.name}
              </Button>
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
          <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 pl-6.5 bg-muted/20">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 className="text-[13px] font-bold text-foreground">Enter Marks</h3>
            </div>
            <div className="divide-y divide-border/50 pl-6.5" role="list">
              {students.map((student, index) => {
                const markValue = marks[String(student.id)] ?? "";
                const percentage = exam.totalMarks > 0 && markValue !== "" ? Math.round((Number(markValue) / exam.totalMarks) * 100) : null;
                const grade = percentage !== null ? getGrade(percentage) : null;
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3"
                    role="listitem"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-primary" aria-hidden="true">
                      {(student.name ?? "?").split(" ").map((namePart) => namePart[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{student.name ?? "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{classNamesById.get(student.classId) || student.classId} · {student.rollNo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {grade && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ color: grade.color, background: grade.bg }} role="status">
                          {grade.label} · {percentage}%
                        </span>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={exam.totalMarks}
                          value={markValue}
                          aria-label={`Marks for ${student.name ?? "student"}`}
                          onChange={(event) => { setMarks((previousMarks) => ({ ...previousMarks, [String(student.id)]: event.target.value })); setSaved(false); }}
                          className={FORM_INPUT_COMPACT}
                          placeholder="—"
                        />
                        <span className="text-[11px] text-muted-foreground" aria-hidden="true">/ {exam.totalMarks}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>

          <div className="flex justify-end">
            {saved ? (
              <div className="flex items-center gap-2 text-success text-sm font-semibold" role="status">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Marks saved!
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
              >
                <Save className="w-4 h-4" aria-hidden="true" /> Save Marks
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
