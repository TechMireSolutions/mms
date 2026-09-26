import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatTeacherDisplayName, type Teacher } from '@mms/shared';
import type {
  Class,
  SessionClassFee,
  SessionClassSchedule,
  SessionClassBudget,
  SessionClassDiscount,
  SessionClassTimetable,
  SessionClassTimetablePeriod,
  SessionClassRefreshment,
  SessionClassScholarship,
  ScholarshipEligibility,
} from '@/lib/data/sessionsData';

export const EMPTY_CLASS: Class = {
  id: '',
  name: '',
  gender: 'mixed',
  ageCalculationDate: '',
  minAge: 0,
  maxAge: 0,
  maxStudents: 0,
  enrolled: 0,
  enrollmentDeadline: '',
  status: 'active',
  facultyId: '',
  facultyName: '',
  teacherId: '',
  teacherName: '',
  room: '',
  fees: [],
  schedules: [],
  budgets: [],
  discounts: [],
  timetables: [],
  refreshments: [],
  scholarships: [],
};

function createEmptyTimetable(classId: string): SessionClassTimetable {
  return {
    id: crypto.randomUUID(),
    classId,
    date: new Date().toISOString().slice(0, 10),
    periods: [],
  };
}

function createEmptyEligibility(): ScholarshipEligibility {
  return {
    id: crypto.randomUUID(),
    orphan: false,
    job: false,
    business: false,
    property: false,
    familyMembers: 0,
    onJobMembers: 0,
    schoolGoingSiblings: 0,
    residence: 'rental',
  };
}

function createEmptyScholarship(classId: string): SessionClassScholarship {
  return {
    id: crypto.randomUUID(),
    classId,
    percentage: 0,
    expiryDate: '',
    eligibility: createEmptyEligibility(),
  };
}

interface UseClassDetailDraftOptions {
  open: boolean;
  sessionClass: Class | null;
  allTeachers: Teacher[];
}

export function useClassDetailDraft({ open, sessionClass, allTeachers }: UseClassDetailDraftOptions) {
  const [classDraft, setClassDraft] = useState<Class>(() =>
    sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS, id: crypto.randomUUID() },
  );

  useEffect(() => {
    if (open) {
      setClassDraft(sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS, id: crypto.randomUUID() });
    }
  }, [open, sessionClass]);

  const updateDraft = useCallback(<K extends keyof Class>(field: K, value: Class[K]) => {
    setClassDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 1. Fee Handlers
  const addFeeRow = useCallback(() => {
    setClassDraft((prev) => {
      const newFee: SessionClassFee = {
        id: crypto.randomUUID(),
        classId: prev.id,
        feeType: 'Tuition Fee',
        amount: 0,
      };
      return { ...prev, fees: [...(prev.fees || []), newFee] };
    });
  }, []);

  const removeFeeRow = useCallback((id: string) => {
    setClassDraft((prev) => ({ ...prev, fees: (prev.fees || []).filter((f) => f.id !== id) }));
  }, []);

  const updateFeeRow = useCallback((id: string, patch: Partial<SessionClassFee>) => {
    setClassDraft((prev) => ({
      ...prev,
      fees: (prev.fees || []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }, []);

  // 2. Discount Handlers
  const addDiscountRow = useCallback(() => {
    setClassDraft((prev) => {
      const newDiscount: SessionClassDiscount = {
        id: crypto.randomUUID(),
        classId: prev.id,
        discountType: 'Sibling Discount',
        percentage: 0,
        status: 'active',
        startDate: '',
        endDate: '',
        eligibilityCriteria: {},
      };
      return { ...prev, discounts: [...(prev.discounts || []), newDiscount] };
    });
  }, []);

  const removeDiscountRow = useCallback((id: string) => {
    setClassDraft((prev) => ({
      ...prev,
      discounts: (prev.discounts || []).filter((d) => d.id !== id),
    }));
  }, []);

  const updateDiscountRow = useCallback((id: string, patch: Partial<SessionClassDiscount>) => {
    setClassDraft((prev) => ({
      ...prev,
      discounts: (prev.discounts || []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  // 3. Schedule Handlers
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
  }, []);

  const removeScheduleRow = useCallback((id: string) => {
    setClassDraft((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).filter((s) => s.id !== id),
    }));
  }, []);

  const updateScheduleRow = useCallback((id: string, patch: Partial<SessionClassSchedule>) => {
    setClassDraft((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  // Timetable Period Handlers
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
  }, [allTeachers]);

  const removePeriodRow = useCallback((id: string) => {
    setClassDraft((prev) => {
      const timetable = prev.timetables?.[0] ?? createEmptyTimetable(prev.id);
      const updatedPeriods = (timetable.periods || []).filter((p) => p.id !== id);
      return { ...prev, timetables: [{ ...timetable, periods: updatedPeriods }] };
    });
  }, []);

  const updatePeriodRow = useCallback((id: string, patch: Partial<SessionClassTimetablePeriod>) => {
    setClassDraft((prev) => {
      const timetable = prev.timetables?.[0] ?? createEmptyTimetable(prev.id);
      const updatedPeriods = (timetable.periods || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
      return { ...prev, timetables: [{ ...timetable, periods: updatedPeriods }] };
    });
  }, []);

  // 4. Budget Handlers
  const addBudgetRow = useCallback(() => {
    setClassDraft((prev) => {
      const newBudget: SessionClassBudget = {
        id: crypto.randomUUID(),
        classId: prev.id,
        budgetType: 'expense',
        detail: 'Class Materials & Stationary',
        amount: 0,
      };
      return { ...prev, budgets: [...(prev.budgets || []), newBudget] };
    });
  }, []);

  const removeBudgetRow = useCallback((id: string) => {
    setClassDraft((prev) => ({
      ...prev,
      budgets: (prev.budgets || []).filter((b) => b.id !== id),
    }));
  }, []);

  const updateBudgetRow = useCallback((id: string, patch: Partial<SessionClassBudget>) => {
    setClassDraft((prev) => ({
      ...prev,
      budgets: (prev.budgets || []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  // Refreshment Handlers
  const addRefreshmentRow = useCallback(() => {
    setClassDraft((prev) => {
      const newRefreshment: SessionClassRefreshment = {
        id: crypto.randomUUID(),
        classId: prev.id,
        date: new Date().toISOString().slice(0, 10),
        item: 'Snacks & Juices',
        quantity: 0,
        pricePerUnit: 0,
        paidAmount: 0,
      };
      return { ...prev, refreshments: [...(prev.refreshments || []), newRefreshment] };
    });
  }, []);

  const removeRefreshmentRow = useCallback((id: string) => {
    setClassDraft((prev) => ({
      ...prev,
      refreshments: (prev.refreshments || []).filter((r) => r.id !== id),
    }));
  }, []);

  const updateRefreshmentRow = useCallback((id: string, patch: Partial<SessionClassRefreshment>) => {
    setClassDraft((prev) => ({
      ...prev,
      refreshments: (prev.refreshments || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  // 5. Scholarship Handlers
  const activeScholarship = useMemo(
    () => classDraft.scholarships?.[0] ?? createEmptyScholarship(classDraft.id),
    [classDraft.scholarships, classDraft.id],
  );

  const updateScholarship = useCallback((patch: Partial<SessionClassScholarship>) => {
    setClassDraft((prev) => {
      const current = prev.scholarships?.[0] ?? createEmptyScholarship(prev.id);
      return { ...prev, scholarships: [{ ...current, ...patch }] };
    });
  }, []);

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
    [],
  );

  return {
    classDraft,
    setClassDraft,
    updateDraft,
    // Fees
    addFeeRow,
    removeFeeRow,
    updateFeeRow,
    // Discounts
    addDiscountRow,
    removeDiscountRow,
    updateDiscountRow,
    // Schedules & Timetables
    addScheduleRow,
    removeScheduleRow,
    updateScheduleRow,
    activeTimetable,
    addPeriodRow,
    removePeriodRow,
    updatePeriodRow,
    // Budgets & Refreshments
    addBudgetRow,
    removeBudgetRow,
    updateBudgetRow,
    addRefreshmentRow,
    removeRefreshmentRow,
    updateRefreshmentRow,
    // Scholarships
    activeScholarship,
    updateScholarship,
    updateEligibility,
  };
}
