import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Save, CheckCircle2, Users, Search, Loader2 } from "lucide-react";
import { type Exam, type ExamResult } from "@/lib/data/examinationData";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import type { Student } from "@/lib/data/studentsData";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { FORM_INPUT_COMPACT } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { CARD_STRIPE_INSET } from "@/lib/semanticTone";
import { EnterMarksStudentRow } from "./EnterMarksStudentRow";

export interface EnterMarksProps {
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
export function EnterMarks({ exams, results, onSaveResults }: EnterMarksProps): React.JSX.Element {
  const { t } = useTranslation();
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [marks, setMarks] = useState<Record<string, number | string>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const exam = exams.find((examOption) => examOption.id === selectedExam);

  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();
  const classNamesById = (() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      if (session.classes) {
        for (const sessionClass of session.classes) {
          map.set(sessionClass.id, `${session.name} - ${sessionClass.name}`);
        }
      }
    }
    return map;
  })();

  const studentIds = (() => {
    if (!exam?.classIds || exam.classIds.length === 0) return [];
    const classIds = new Set(exam.classIds);
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const enrollment of enrollments) {
      if (classIds.has(enrollment.classId)) {
        const idStr = String(enrollment.studentId);
        if (!seen.has(idStr)) {
          seen.add(idStr);
          ids.push(idStr);
        }
      }
    }
    return ids;
  })();

  const { data: resolvedStudents = [] } = useStudentsByIds(studentIds);

  const students = ((): Array<Student & { classId: string; rollNo: string }> => {
    if (!exam?.classIds || exam.classIds.length === 0) return [];
    const classIds = new Set(exam.classIds);
    const enrollmentByStudent = new Map<string, (typeof enrollments)[number]>();
    for (const enrollment of enrollments) {
      if (classIds.has(enrollment.classId)) {
        enrollmentByStudent.set(String(enrollment.studentId), enrollment);
      }
    }
    const result: Array<Student & { classId: string; rollNo: string }> = [];
    for (const student of (resolvedStudents as Student[])) {
      const enrollment = enrollmentByStudent.get(String(student.id));
      if (enrollment) {
        result.push({
          ...student,
          classId: enrollment.classId,
          rollNo: student.grNumber ?? "",
        });
      }
    }
    return result;
  })();

  const filteredStudents = (() => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(query)),
    );
  })();

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

  const hasInvalidMarks = (() => {
    if (!exam) return false;
    return Object.values(marks).some((m) => {
      if (m === "" || m === undefined) return false;
      const num = Number(m);
      return isNaN(num) || num < 0 || num > exam.totalMarks;
    });
  })();

  const handleSave = async () => {
    if (!exam || isSaving || hasInvalidMarks) return;
    setIsSaving(true);
    try {
      const newResults: ExamResult[] = students.map((student) => ({
        id: `er_${exam.id}_${student.id}`,
        examId: exam.id,
        studentId: String(student.id),
        marksObtained: Number(marks[String(student.id)] || 0),
      }));
      await onSaveResults(exam.id, newResults);
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
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
                className={cn(
                  "px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card hover:bg-muted text-foreground",
                )}
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
            <div className={cn("px-4 py-3 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 bg-muted/20", CARD_STRIPE_INSET)}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground">{t("examinations.marks")}</h3>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("examinations.marks.searchPlaceholder")}
                  className={cn(FORM_INPUT_COMPACT, "ps-8 text-xs")}
                />
              </div>
            </div>
            <div className={cn("divide-y divide-border/50 max-h-150 overflow-y-auto", CARD_STRIPE_INSET)} role="list">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {t("examinations.empty.results")}
                </div>
              ) : (
                filteredStudents.map((student, index) => (
                  <EnterMarksStudentRow
                    key={student.id}
                    student={student}
                    index={index}
                    exam={exam}
                    classNameText={classNamesById.get(student.classId) || student.classId}
                    markValue={marks[String(student.id)] ?? ""}
                    onMarkChange={(studentId, value) => {
                      setMarks((previousMarks) => ({ ...previousMarks, [studentId]: value }));
                      setSaved(false);
                    }}
                  />
                ))
              )}
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
                disabled={isSaving || hasInvalidMarks}
                onClick={() => { void handleSave(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                {t("examinations.enterMarks.save")}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
