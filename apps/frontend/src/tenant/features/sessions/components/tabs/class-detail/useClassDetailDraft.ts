import { useState, useEffect, useCallback } from 'react';
import type { Teacher } from '@mms/shared';
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
} from '@/lib/data/sessionsData';
import { formatTeacherDisplayName } from './types';

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
    const newFee: SessionClassFee = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      feeType: 'Tuition Fee',
      amount: 0,
    };
    updateDraft('fees', [...(classDraft.fees || []), newFee]);
  }, [classDraft.id, classDraft.fees, updateDraft]);

  const removeFeeRow = useCallback((id: string) => {
    updateDraft('fees', (classDraft.fees || []).filter((f) => f.id !== id));
  }, [classDraft.fees, updateDraft]);

  const updateFeeRow = useCallback((id: string, patch: Partial<SessionClassFee>) => {
    updateDraft('fees', (classDraft.fees || []).map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, [classDraft.fees, updateDraft]);

  // 2. Discount Handlers
  const addDiscountRow = useCallback(() => {
    const newDiscount: SessionClassDiscount = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      discountType: 'Sibling Discount',
      percentage: 0,
      status: 'active',
      startDate: '',
      endDate: '',
      eligibilityCriteria: {},
    };
    updateDraft('discounts', [...(classDraft.discounts || []), newDiscount]);
  }, [classDraft.id, classDraft.discounts, updateDraft]);

  const removeDiscountRow = useCallback((id: string) => {
    updateDraft('discounts', (classDraft.discounts || []).filter((d) => d.id !== id));
  }, [classDraft.discounts, updateDraft]);

  const updateDiscountRow = useCallback((id: string, patch: Partial<SessionClassDiscount>) => {
    updateDraft('discounts', (classDraft.discounts || []).map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, [classDraft.discounts, updateDraft]);

  // 3. Schedule Handlers
  const addScheduleRow = useCallback(() => {
    const newSchedule: SessionClassSchedule = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      scheduleType: 'daily',
      startDate: '',
      endDate: '',
    };
    updateDraft('schedules', [...(classDraft.schedules || []), newSchedule]);
  }, [classDraft.id, classDraft.schedules, updateDraft]);

  const removeScheduleRow = useCallback((id: string) => {
    updateDraft('schedules', (classDraft.schedules || []).filter((s) => s.id !== id));
  }, [classDraft.schedules, updateDraft]);

  const updateScheduleRow = useCallback((id: string, patch: Partial<SessionClassSchedule>) => {
    updateDraft('schedules', (classDraft.schedules || []).map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, [classDraft.schedules, updateDraft]);

  // Timetable Period Handlers
  const activeTimetable: SessionClassTimetable = classDraft.timetables?.[0] || {
    id: crypto.randomUUID(),
    classId: classDraft.id,
    date: new Date().toISOString().slice(0, 10),
    periods: [],
  };

  const addPeriodRow = useCallback(() => {
    const firstTeacher = allTeachers[0];
    const initialTeacherName = formatTeacherDisplayName(firstTeacher) || 'Instructor';
    const newPeriod: SessionClassTimetablePeriod = {
      id: crypto.randomUUID(),
      timetableId: activeTimetable.id,
      startTime: '08:00',
      endTime: '09:00',
      subject: 'Quran Memorization',
      teacherId: firstTeacher?.id ? String(firstTeacher.id) : '',
      teacherName: initialTeacherName,
    };
    updateDraft('timetables', [{ ...activeTimetable, periods: [...(activeTimetable.periods || []), newPeriod] }]);
  }, [activeTimetable, allTeachers, updateDraft]);

  const removePeriodRow = useCallback((id: string) => {
    const updatedPeriods = (activeTimetable.periods || []).filter((p) => p.id !== id);
    updateDraft('timetables', [{ ...activeTimetable, periods: updatedPeriods }]);
  }, [activeTimetable, updateDraft]);

  const updatePeriodRow = useCallback((id: string, patch: Partial<SessionClassTimetablePeriod>) => {
    const updatedPeriods = (activeTimetable.periods || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
    updateDraft('timetables', [{ ...activeTimetable, periods: updatedPeriods }]);
  }, [activeTimetable, updateDraft]);

  // 4. Budget Handlers
  const addBudgetRow = useCallback(() => {
    const newBudget: SessionClassBudget = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      budgetType: 'expense',
      detail: 'Class Materials & Stationary',
      amount: 0,
    };
    updateDraft('budgets', [...(classDraft.budgets || []), newBudget]);
  }, [classDraft.id, classDraft.budgets, updateDraft]);

  const removeBudgetRow = useCallback((id: string) => {
    updateDraft('budgets', (classDraft.budgets || []).filter((b) => b.id !== id));
  }, [classDraft.budgets, updateDraft]);

  const updateBudgetRow = useCallback((id: string, patch: Partial<SessionClassBudget>) => {
    updateDraft('budgets', (classDraft.budgets || []).map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }, [classDraft.budgets, updateDraft]);

  // Refreshment Handlers
  const addRefreshmentRow = useCallback(() => {
    const newRefreshment: SessionClassRefreshment = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      date: new Date().toISOString().slice(0, 10),
      item: 'Snacks & Juices',
      quantity: 0,
      pricePerUnit: 0,
      paidAmount: 0,
    };
    updateDraft('refreshments', [...(classDraft.refreshments || []), newRefreshment]);
  }, [classDraft.id, classDraft.refreshments, updateDraft]);

  const removeRefreshmentRow = useCallback((id: string) => {
    updateDraft('refreshments', (classDraft.refreshments || []).filter((r) => r.id !== id));
  }, [classDraft.refreshments, updateDraft]);

  const updateRefreshmentRow = useCallback((id: string, patch: Partial<SessionClassRefreshment>) => {
    updateDraft('refreshments', (classDraft.refreshments || []).map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, [classDraft.refreshments, updateDraft]);

  // 5. Scholarship Handlers
  const activeScholarship: SessionClassScholarship = classDraft.scholarships?.[0] || {
    id: crypto.randomUUID(),
    classId: classDraft.id,
    percentage: 0,
    expiryDate: '',
    eligibility: {
      id: crypto.randomUUID(),
      orphan: false,
      job: false,
      business: false,
      property: false,
      familyMembers: 0,
      onJobMembers: 0,
      schoolGoingSiblings: 0,
      residence: 'rental',
    },
  };

  const updateScholarship = useCallback((patch: Partial<SessionClassScholarship>) => {
    updateDraft('scholarships', [{ ...activeScholarship, ...patch }]);
  }, [activeScholarship, updateDraft]);

  const updateEligibility = useCallback((patch: Partial<NonNullable<SessionClassScholarship['eligibility']>>) => {
    const updated = {
      ...activeScholarship,
      eligibility: {
        ...(activeScholarship.eligibility || {
          id: crypto.randomUUID(),
          orphan: false,
          job: false,
          business: false,
          property: false,
          familyMembers: 0,
          onJobMembers: 0,
          schoolGoingSiblings: 0,
          residence: 'rental',
        }),
        ...patch,
      },
    };
    updateDraft('scholarships', [updated]);
  }, [activeScholarship, updateDraft]);

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
