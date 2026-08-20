import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Save, CheckCircle2, Users } from "lucide-react";
import { Exam, ExamResult } from '@/lib/data/examinationData';
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import type { Student } from "@/lib/data/studentsData";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { getGrade } from "@/tenant/features/examinations/components/gradeUtils";
import { FORM_INPUT_COMPACT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface EnterMarksProps {
  exams: Exam[];
  results: ExamResult[];
  onSaveResults: (examId: string, results: ExamResult[]) => void | Promise<void>;
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
  const { t } = useTranslation();
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

  const handleSave = async () => {
    if (!exam) return;
    const newResults: ExamResult[] = students.map((student) => ({
      id: `er_${exam.id}_${student.id}`,
      examId: exam.id,
      studentId: String(student.id),
      marksObtained: Number(marks[String(student.id)] || 0),
    }));
    await onSaveResults(exam.id, newResults);
    setSaved(true);
  };

  return (
    <section className="space-y-5" aria-labelledby="enter-marks-title">
      {/* Exam selector */}
      <div>
        <span id="enter-marks-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{t("examinations.selectExam")}</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("examinations.enterMarks.selectExamAria")}>
          {exams.map((examOption) => {
            const isSelected = selectedExam === examOption.id;
            return (
              <Button
                key={examOption.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => { setSelectedExam(examOption.id); setSaved(false); }}
                className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
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
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 flex flex-wrap gap-4 text-sm" role="status" aria-label={t("examinations.enterMarks.examDetailsAria")}>
            <span><strong className="text-foreground">{exam.subject}</strong></span>
            <span className="text-muted-foreground">{t("examinations.enterMarks.totalLabel")}: <strong className="text-foreground">{exam.totalMarks}</strong></span>
            <span className="text-muted-foreground">{t("examinations.enterMarks.passingLabel")}: <strong className="text-foreground">{exam.passingMarks}</strong></span>
            <span className="text-muted-foreground">{t("examinations.stats.students")}: <strong className="text-foreground">{students.length}</strong></span>
          </div>

          {/* Marks entry table */}
          <Card accentColor="primary" className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2 ps-6.5 bg-muted/20">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-bold text-foreground">{t("examinations.marks")}</h3>
            </div>
            <div className="divide-y divide-border/50 ps-6.5" role="list">
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
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                    role="listitem"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar id={student.id} name={student.name} className="w-7 h-7 shrink-0 rounded-full text-xs font-bold" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{student.name ?? t("examinations.enterMarks.studentFallback")}</p>
                      <p className="truncate text-xs text-muted-foreground">{classNamesById.get(student.classId) || student.classId} · {student.rollNo}</p>
                    </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 self-end sm:self-auto">
                      {grade && (
                        <Badge
                          as="span"
                          tone={grade.tone ?? "primary"}
                          pill
                          className="text-xs font-bold px-2 py-0.5"
                          role="status"
                        >
                          {grade.label} · {percentage}%
                        </Badge>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={exam.totalMarks}
                          value={markValue}
                          aria-label={t("examinations.enterMarks.marksInputAria", { name: student.name ?? t("examinations.enterMarks.studentLabel") })}
                          onChange={(event) => { setMarks((previousMarks) => ({ ...previousMarks, [String(student.id)]: event.target.value })); setSaved(false); }}
                          className={cn(FORM_INPUT_COMPACT, "w-20 shrink-0")}
                          placeholder="—"
                        />
                        <span className="text-xs text-muted-foreground shrink-0" aria-hidden="true">/ {exam.totalMarks}</span>
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
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t("examinations.enterMarks.saved")}
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => { void handleSave(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
              >
                <Save className="w-4 h-4" aria-hidden="true" /> {t("examinations.enterMarks.save")}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
