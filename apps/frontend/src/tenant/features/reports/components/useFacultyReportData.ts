import { useMemo, useCallback, useState } from "react";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { collectTeacherIdsFromSessions } from '@/lib/registryResolve';
import { teacherNameById } from '@/lib/teachers/teacherAssignment';
import { useTranslation } from "@/hooks/useTranslation";

export interface FacultyWorkloadItem {
  faculty: string;
  classes: number;
  sessions: number;
  totalStudents: number;
}

export function useFacultyReportData() {
  const { t } = useTranslation();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const sessions = useSessionsCollection();
  const teacherIds = useMemo(() => collectTeacherIdsFromSessions(sessions), [sessions]);
  const { data: teachers = [] } = useTeachersByIds(teacherIds);

  const resolveClassTeacher = useCallback((teacherId: string, teacherName: string): string => {
    const fromRegistry = teacherNameById(teachers, teacherId);
    return fromRegistry || teacherName || t("teachers.report.unassigned");
  }, [teachers, t]);

  const facultyWorkload = useMemo<FacultyWorkloadItem[]>(() => {
    const workloadByTeacherName: Record<string, { classes: Set<string>, sessions: Set<string>, students: number }> = {};
    sessions.forEach((session) => {
       (session.classes || []).forEach((sessionClass) => {
         const teacherName = resolveClassTeacher(sessionClass.teacherId, sessionClass.teacherName ?? '');
         if (!workloadByTeacherName[teacherName]) {
           workloadByTeacherName[teacherName] = { classes: new Set(), sessions: new Set(), students: 0 };
         }

         workloadByTeacherName[teacherName].classes.add(sessionClass.id);
         workloadByTeacherName[teacherName].sessions.add(session.id);
         workloadByTeacherName[teacherName].students += sessionClass.enrolled;
       });
    });

    return Object.entries(workloadByTeacherName).map(([teacherName, workload]) => ({
      faculty: teacherName,
      classes: workload.classes.size,
      sessions: workload.sessions.size,
      totalStudents: workload.students,
    })).sort((firstFaculty, secondFaculty) => secondFaculty.totalStudents - firstFaculty.totalStudents);
  }, [sessions, resolveClassTeacher]);

  const totalFaculty = facultyWorkload.length;
  const totalStudents = facultyWorkload.reduce((total, faculty) => total + faculty.totalStudents, 0);
  const totalClasses = facultyWorkload.reduce((total, faculty) => total + faculty.classes, 0);
  const avgStudents = totalFaculty
    ? (totalStudents / totalFaculty).toFixed(1)
    : 0;
  const filteredFacultyWorkload = useMemo(
    () => (
      selectedFaculty
        ? facultyWorkload.filter((facultyItem) => facultyItem.faculty === selectedFaculty)
        : facultyWorkload
    ),
    [facultyWorkload, selectedFaculty],
  );

  const toggleFacultyFilter = (faculty: string) => {
    setSelectedFaculty((current) => (current === faculty ? null : faculty));
  };

  return {
    t,
    selectedFaculty,
    setSelectedFaculty,
    facultyWorkload,
    filteredFacultyWorkload,
    totalFaculty,
    totalStudents,
    totalClasses,
    avgStudents,
    toggleFacultyFilter,
  };
}
