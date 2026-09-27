import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { formatTeacherDisplayName, type Teacher } from '@mms/shared';
import type {
  Class,
  SessionClassSchedule,
  SessionClassTimetablePeriod,
  SessionClassScholarship,
} from '@/lib/data/sessionsData';
import {
  createEmptyTimetable,
  createEmptyScholarship,
  createEmptyEligibility,
} from './classDetailDraftDefaults';

export function useClassDetailAcademicDraft(
  classDraft: Class,
  setClassDraft: Dispatch<SetStateAction<Class>>,
  allTeachers: Teacher[],
) {
  const addScheduleRow = useCallback(() => {
    setClassDraft((prev) => {
      const newSchedule: SessionClassSchedule = {
        id: crypto.randomUUID(),
        classId: prev.id,
        scheduleType: 'daily',
        startDate: '',
        endDate: '',
      };
      return { ...prev, schedules: [...(prev.schedules || []), newSchedule] };
    });
  }, [setClassDraft]);

  const removeScheduleRow = useCallback((id: string) => {
    setClassDraft((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).filter((s) => s.id !== id),
    }));
  }, [setClassDraft]);

  const updateScheduleRow = useCallback((id: string, patch: Partial<SessionClassSchedule>) => {
    setClassDraft((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, [setClassDraft]);

  const activeTimetable = useMemo(
    () => classDraft.timetables?.[0] ?? createEmptyTimetable(classDraft.id),
    [classDraft.timetables, classDraft.id],
  );

  const addPeriodRow = useCallback(() => {
    const firstTeacher = allTeachers[0];
    const initialTeacherName = formatTeacherDisplayName(firstTeacher) || 'Instructor';
    setClassDraft((prev) => {
      const timetable = prev.timetables?.[0] ?? createEmptyTimetable(prev.id);
      const newPeriod: SessionClassTimetablePeriod = {
        id: crypto.randomUUID(),
        timetableId: timetable.id,
        startTime: '08:00',
        endTime: '09:00',
        subject: 'Quran Memorization',
        facultyId: firstTeacher?.id ? String(firstTeacher.id) : '',
        facultyName: initialTeacherName,
        teacherId: firstTeacher?.id ? String(firstTeacher.id) : '',
        teacherName: initialTeacherName,
      };
      return {
        ...prev,
        timetables: [{ ...timetable, periods: [...(timetable.periods || []), newPeriod] }],
      };
    });
  }, [allTeachers, setClassDraft]);

  const removePeriodRow = useCallback((id: string) => {
    setClassDraft((prev) => {
      const timetable = prev.timetables?.[0] ?? createEmptyTimetable(prev.id);
      const updatedPeriods = (timetable.periods || []).filter((p) => p.id !== id);
      return { ...prev, timetables: [{ ...timetable, periods: updatedPeriods }] };
    });
  }, [setClassDraft]);

  const updatePeriodRow = useCallback((id: string, patch: Partial<SessionClassTimetablePeriod>) => {
    setClassDraft((prev) => {
      const timetable = prev.timetables?.[0] ?? createEmptyTimetable(prev.id);
      const updatedPeriods = (timetable.periods || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
      return { ...prev, timetables: [{ ...timetable, periods: updatedPeriods }] };
    });
  }, [setClassDraft]);

  const activeScholarship = useMemo(
    () => classDraft.scholarships?.[0] ?? createEmptyScholarship(classDraft.id),
    [classDraft.scholarships, classDraft.id],
  );

  const updateScholarship = useCallback((patch: Partial<SessionClassScholarship>) => {
    setClassDraft((prev) => {
      const current = prev.scholarships?.[0] ?? createEmptyScholarship(prev.id);
      return { ...prev, scholarships: [{ ...current, ...patch }] };
    });
  }, [setClassDraft]);

  const updateEligibility = useCallback(
    (patch: Partial<NonNullable<SessionClassScholarship['eligibility']>>) => {
      setClassDraft((prev) => {
        const current = prev.scholarships?.[0] ?? createEmptyScholarship(prev.id);
        const eligibility = current.eligibility ?? createEmptyEligibility();
        return {
          ...prev,
          scholarships: [{ ...current, eligibility: { ...eligibility, ...patch } }],
        };
      });
    },
    [setClassDraft],
  );

  return {
    addScheduleRow,
    removeScheduleRow,
    updateScheduleRow,
    activeTimetable,
    addPeriodRow,
    removePeriodRow,
    updatePeriodRow,
    activeScholarship,
    updateScholarship,
    updateEligibility,
  };
}
