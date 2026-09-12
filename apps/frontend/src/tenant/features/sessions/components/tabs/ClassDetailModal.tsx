/**
 * @file ClassDetailModal.tsx
 * @description Model 6 comprehensive, headache-free Class Workspace Modal for configuring:
 * 1. General & Age Rules
 * 2. Class Fees & Discounts
 * 3. Schedules & Timetable Periods
 * 4. Budgets & Refreshments
 * 5. Scholarships & Eligibility Criteria
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Coffee,
  Award,
  Plus,
  Trash2,
  Clock,
  Tag,
  Users,
  Wallet,
} from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL, FORM_INPUT_ERROR } from '@/components/ui/formStyles';
import { FieldErrorMessage, RequiredMark } from '@/components/ui/FormPrimitives';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersContractList, useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { TEACHERS_MODULE_MANIFEST, type Teacher } from '@mms/shared';
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

interface ClassDetailModalProps {
  open: boolean;
  sessionClass: Class | null;
  onClose: () => void;
  onSave: (updatedClass: Class) => void | Promise<void>;
  saving?: boolean;
}

const TABS = [
  { id: 'general', label: 'General & Rules', icon: GraduationCap },
  { id: 'fees', label: 'Fees & Discounts', icon: Wallet },
  { id: 'schedule', label: 'Schedule & Timetable', icon: Calendar },
  { id: 'budget', label: 'Budget & Refreshment', icon: Coffee },
  { id: 'scholarship', label: 'Scholarships', icon: Award },
] as const;

type TabId = (typeof TABS)[number]['id'];

const EMPTY_CLASS: Class = {
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

function formatTeacherDisplayName(teacher?: Partial<Teacher> | null): string {
  if (!teacher) return '';
  const name = (teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')).trim();
  if (name) {
    return teacher.employeeId ? `${name} (${teacher.employeeId})` : name;
  }
  if (teacher.employeeId) {
    return `Teacher (${teacher.employeeId})`;
  }
  return teacher.id ? `Teacher #${String(teacher.id).slice(0, 8)}` : '';
}

export function ClassDetailModal({
  open,
  sessionClass,
  onClose,
  onSave,
  saving = false,
}: ClassDetailModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const { activeCurrency } = useFinanceCurrency();
  const currencySymbol = activeCurrency?.symbol || '';
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [classDraft, setClassDraft] = useState<Class>(() => (sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS, id: crypto.randomUUID() }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Teachers for periods & teacher assignment
  const { data: teachersData } = useTeachersContractList(
    { page: 1, limit: TEACHERS_MODULE_MANIFEST.maxPageSize, status: 'active' },
    open,
  );
  const teachersList = (teachersData?.body?.teachers ?? []) as Teacher[];

  // Also query assigned teacher by ID if not in active list
  const selectedTeacherId = classDraft.teacherId ? [classDraft.teacherId] : [];
  const { data: selectedTeachersData } = useTeachersByIds(selectedTeacherId);
  const selectedTeachers = (selectedTeachersData ?? []) as Teacher[];

  const allTeachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const t of teachersList) {
      if (t?.id) map.set(String(t.id), t);
    }
    for (const t of selectedTeachers) {
      if (t?.id && !map.has(String(t.id))) {
        map.set(String(t.id), t);
      }
    }
    return Array.from(map.values());
  }, [teachersList, selectedTeachers]);

  useEffect(() => {
    if (open) {
      setClassDraft(sessionClass ? { ...sessionClass } : { ...EMPTY_CLASS, id: crypto.randomUUID() });
      setActiveTab('general');
      setErrors({});
    }
  }, [open, sessionClass]);

  const updateDraft = <K extends keyof Class>(field: K, value: Class[K]) => {
    setClassDraft((prev) => ({ ...prev, [field]: value }));
  };

  // --- 1. Fee Helpers ---
  const addFeeRow = () => {
    const newFee: SessionClassFee = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      feeType: 'Tuition Fee',
      amount: 0,
    };
    updateDraft('fees', [...(classDraft.fees || []), newFee]);
  };

  const removeFeeRow = (id: string) => {
    updateDraft('fees', (classDraft.fees || []).filter((f) => f.id !== id));
  };

  const updateFeeRow = (id: string, patch: Partial<SessionClassFee>) => {
    updateDraft(
      'fees',
      (classDraft.fees || []).map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  };

  // --- 2. Discount Helpers ---
  const addDiscountRow = () => {
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
  };

  const removeDiscountRow = (id: string) => {
    updateDraft('discounts', (classDraft.discounts || []).filter((d) => d.id !== id));
  };

  const updateDiscountRow = (id: string, patch: Partial<SessionClassDiscount>) => {
    updateDraft(
      'discounts',
      (classDraft.discounts || []).map((d) => (d.id === id ? { ...d, ...patch } : d)),
    );
  };

  // --- 3. Schedule & Timetable Helpers ---
  const addScheduleRow = () => {
    const newSchedule: SessionClassSchedule = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      scheduleType: 'daily',
      startDate: '',
      endDate: '',
    };
    updateDraft('schedules', [...(classDraft.schedules || []), newSchedule]);
  };

  const removeScheduleRow = (id: string) => {
    updateDraft('schedules', (classDraft.schedules || []).filter((s) => s.id !== id));
  };

  const updateScheduleRow = (id: string, patch: Partial<SessionClassSchedule>) => {
    updateDraft(
      'schedules',
      (classDraft.schedules || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  };

  // Timetable Period
  const activeTimetable: SessionClassTimetable = classDraft.timetables?.[0] || {
    id: crypto.randomUUID(),
    classId: classDraft.id,
    date: new Date().toISOString().slice(0, 10),
    periods: [],
  };

  const addPeriodRow = () => {
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
    const updatedPeriods = [...(activeTimetable.periods || []), newPeriod];

    const updatedTimetable = { ...activeTimetable, periods: updatedPeriods };
    updateDraft('timetables', [updatedTimetable]);
  };

  const removePeriodRow = (id: string) => {
    const updatedPeriods = (activeTimetable.periods || []).filter((p) => p.id !== id);
    const updatedTimetable = { ...activeTimetable, periods: updatedPeriods };
    updateDraft('timetables', [updatedTimetable]);
  };

  const updatePeriodRow = (id: string, patch: Partial<SessionClassTimetablePeriod>) => {
    const updatedPeriods = (activeTimetable.periods || []).map((p) => (p.id === id ? { ...p, ...patch } : p));
    const updatedTimetable = { ...activeTimetable, periods: updatedPeriods };
    updateDraft('timetables', [updatedTimetable]);
  };

  // --- 4. Budget & Refreshment Helpers ---
  const addBudgetRow = () => {
    const newBudget: SessionClassBudget = {
      id: crypto.randomUUID(),
      classId: classDraft.id,
      budgetType: 'expense',
      detail: 'Class Materials & Stationary',
      amount: 0,
    };
    updateDraft('budgets', [...(classDraft.budgets || []), newBudget]);
  };

  const removeBudgetRow = (id: string) => {
    updateDraft('budgets', (classDraft.budgets || []).filter((b) => b.id !== id));
  };

  const updateBudgetRow = (id: string, patch: Partial<SessionClassBudget>) => {
    updateDraft(
      'budgets',
      (classDraft.budgets || []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const addRefreshmentRow = () => {
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
  };

  const removeRefreshmentRow = (id: string) => {
    updateDraft('refreshments', (classDraft.refreshments || []).filter((r) => r.id !== id));
  };

  const updateRefreshmentRow = (id: string, patch: Partial<SessionClassRefreshment>) => {
    updateDraft(
      'refreshments',
      (classDraft.refreshments || []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );
  };

  // --- 5. Scholarship Helpers ---
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

  const updateScholarship = (patch: Partial<SessionClassScholarship>) => {
    const updated = { ...activeScholarship, ...patch };
    updateDraft('scholarships', [updated]);
  };

  const updateEligibility = (patch: Partial<NonNullable<SessionClassScholarship['eligibility']>>) => {
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
  };

  // Validation & Save
  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!classDraft.name?.trim()) {
      newErrors.name = t('common.formPleaseFixErrors');
      setActiveTab('general');
    }
    if (classDraft.minAge > 0 && classDraft.maxAge > 0 && classDraft.minAge > classDraft.maxAge) {
      newErrors.maxAge = t('common.formPleaseFixErrors');
      setActiveTab('general');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Resolve assigned teacher name if teacherId set
    let resolvedTeacherName = classDraft.teacherName;
    if (classDraft.teacherId) {
      const teacher = allTeachers.find((t) => String(t.id) === String(classDraft.teacherId));
      if (teacher) {
        resolvedTeacherName = formatTeacherDisplayName(teacher) || resolvedTeacherName;
      }
    }

    const finalClass: Class = {
      ...classDraft,
      teacherName: resolvedTeacherName,
    };

    await onSave(finalClass);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={classDraft.name ? `Class: ${classDraft.name}` : 'New Session Class'}
      icon={GraduationCap}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      onSave={handleSave}
      saving={saving}
      error={Object.values(errors)[0]}
    >
      <div className="max-w-3xl space-y-4">
        {/* Navigation SubTabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-border/60 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="space-y-4">
          {/* TAB 1: General & Rules */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={FORM_LABEL} htmlFor="class-name">
                    Class Name<RequiredMark />
                  </label>
                  <Input
                    id="class-name"
                    name="name"
                    value={classDraft.name}
                    onChange={(e) => updateDraft('name', e.target.value)}
                    placeholder="e.g. Hifz Level 1, Nazra Boys"
                    aria-invalid={Boolean(errors.name)}
                    className={errors.name ? FORM_INPUT_ERROR : undefined}
                  />
                  <FieldErrorMessage message={errors.name} />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-gender">
                    Gender Group
                  </label>
                  <FormSelect
                    id="class-gender"
                    name="gender"
                    value={classDraft.gender}
                    onChange={(val) => updateDraft('gender', val as 'male' | 'female' | 'mixed')}
                    options={[
                      { value: 'mixed', label: 'Mixed / Co-ed' },
                      { value: 'male', label: 'Male Only' },
                      { value: 'female', label: 'Female Only' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={FORM_LABEL} htmlFor="class-min-age">Minimum Age</label>
                  <Input
                    id="class-min-age"
                    name="minAge"
                    type="number"
                    min={0}
                    max={100}
                    value={classDraft.minAge ?? 0}
                    onChange={(e) => updateDraft('minAge', parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-max-age">Maximum Age</label>
                  <Input
                    id="class-max-age"
                    name="maxAge"
                    type="number"
                    min={0}
                    max={100}
                    value={classDraft.maxAge ?? 0}
                    onChange={(e) => updateDraft('maxAge', parseInt(e.target.value, 10) || 0)}
                    aria-invalid={Boolean(errors.maxAge)}
                    className={errors.maxAge ? FORM_INPUT_ERROR : undefined}
                  />
                  <FieldErrorMessage message={errors.maxAge} />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-calc-date">Age Calculation Date</label>
                  <Input
                    id="class-calc-date"
                    type="date"
                    value={classDraft.ageCalculationDate}
                    onChange={(e) => updateDraft('ageCalculationDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={FORM_LABEL} htmlFor="class-capacity">
                    Maximum Students (Capacity)
                  </label>
                  <Input
                    id="class-capacity"
                    type="number"
                    min={0}
                    value={classDraft.maxStudents ?? 0}
                    onChange={(e) => updateDraft('maxStudents', parseInt(e.target.value, 10) || 0)}
                  />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-deadline">Enrollment Deadline</label>
                  <Input
                    id="class-deadline"
                    type="date"
                    value={classDraft.enrollmentDeadline}
                    onChange={(e) => updateDraft('enrollmentDeadline', e.target.value)}
                  />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-status">Status</label>
                  <FormSelect
                    id="class-status"
                    name="status"
                    value={classDraft.status}
                    onChange={(val) => updateDraft('status', val as 'active' | 'inactive')}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={FORM_LABEL} htmlFor="class-teacher">Lead Instructor</label>
                  <FormSelect
                    id="class-teacher"
                    name="teacherId"
                    value={classDraft.teacherId || ''}
                    onChange={(val) => updateDraft('teacherId', val)}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...allTeachers.map((t) => ({
                        value: String(t.id),
                        label: formatTeacherDisplayName(t),
                      })),
                    ]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="class-room">Classroom / Hall</label>
                  <Input
                    id="class-room"
                    value={classDraft.room || ''}
                    onChange={(e) => updateDraft('room', e.target.value)}
                    placeholder="e.g. Hall A, Room 102"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Fees & Discounts */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Fee Schedule */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Class Fee Schedule</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addFeeRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Fee Item
                  </Button>
                </div>

                {(classDraft.fees || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No individual fees specified. Click "Add Fee Item" to define Tuition, Admission, Exam fees, etc.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(classDraft.fees || []).map((fee) => (
                      <div key={fee.id} className="flex items-center gap-2">
                        <Input
                          placeholder="Fee Type (e.g. Admission, Tuition)"
                          value={fee.feeType}
                          onChange={(e) => updateFeeRow(fee.id, { feeType: e.target.value })}
                          className="flex-1 text-xs"
                        />
                        <div className="relative w-36">
                          {currencySymbol && (
                            <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                          )}
                          <Input
                            type="number"
                            min={0}
                            placeholder="Amount"
                            value={fee.amount ?? 0}
                            onChange={(e) => updateFeeRow(fee.id, { amount: parseFloat(e.target.value) || 0 })}
                            className={cn("text-xs", currencySymbol && "ps-6")}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFeeRow(fee.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discounts */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-foreground">Class Discounts & Waivers</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addDiscountRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Discount
                  </Button>
                </div>

                {(classDraft.discounts || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No discounts defined for this class.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(classDraft.discounts || []).map((discount) => (
                      <div key={discount.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Input
                          placeholder="Discount Name (e.g. Sibling 15%)"
                          value={discount.discountType}
                          onChange={(e) => updateDiscountRow(discount.id, { discountType: e.target.value })}
                          className="flex-1 text-xs"
                        />
                        <div className="relative w-24">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={discount.percentage ?? 0}
                            onChange={(e) => updateDiscountRow(discount.id, { percentage: parseFloat(e.target.value) || 0 })}
                            className="text-xs pe-6"
                          />
                          <span className="absolute end-2.5 top-2 text-xs text-muted-foreground">%</span>
                        </div>
                        <div className="w-28">
                          <FormSelect
                            id={`disc-status-${discount.id}`}
                            name="status"
                            value={discount.status || 'active'}
                            onChange={(val) => updateDiscountRow(discount.id, { status: val as any })}
                            options={[
                              { value: 'active', label: 'Active' },
                              { value: 'expired', label: 'Expired' },
                              { value: 'inactive', label: 'Inactive' },
                            ]}
                            className="text-xs"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDiscountRow(discount.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Schedule & Timetable */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Schedules Card */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-foreground">Class Schedule Dates</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addScheduleRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Schedule Block
                  </Button>
                </div>

                {(classDraft.schedules || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No custom schedule block. Session start/end dates will apply.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(classDraft.schedules || []).map((sch) => (
                      <div key={sch.id} className="flex items-center gap-2">
                        <FormSelect
                          id={`sch-type-${sch.id}`}
                          name="scheduleType"
                          value={sch.scheduleType}
                          onChange={(val) => updateScheduleRow(sch.id, { scheduleType: val })}
                          options={[
                            { value: 'daily', label: 'Daily' },
                            { value: 'weekly', label: 'Weekly' },
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'custom', label: 'Custom' },
                          ]}
                          className="w-40 min-w-[150px] shrink-0 text-xs"
                        />
                        <Input
                          type="date"
                          value={sch.startDate}
                          onChange={(e) => updateScheduleRow(sch.id, { startDate: e.target.value })}
                          className="text-xs"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="date"
                          value={sch.endDate}
                          onChange={(e) => updateScheduleRow(sch.id, { endDate: e.target.value })}
                          className="text-xs"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeScheduleRow(sch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timetable Periods */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-foreground">Timetable & Period Breakdown</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addPeriodRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Period
                  </Button>
                </div>

                {(activeTimetable.periods || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No periods defined yet. Click "Add Period" to specify class subjects, timings, and instructors.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(activeTimetable.periods || []).map((period) => (
                      <div key={period.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Input
                          type="time"
                          value={period.startTime}
                          onChange={(e) => updatePeriodRow(period.id, { startTime: e.target.value })}
                          className="w-28 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                          type="time"
                          value={period.endTime}
                          onChange={(e) => updatePeriodRow(period.id, { endTime: e.target.value })}
                          className="w-28 text-xs"
                        />
                        <Input
                          placeholder="Subject (e.g. Hifz, Tajweed, Fiqh)"
                          value={period.subject}
                          onChange={(e) => updatePeriodRow(period.id, { subject: e.target.value })}
                          className="flex-1 text-xs"
                        />
                        <FormSelect
                          id={`period-teacher-${period.id}`}
                          name="teacherName"
                          value={period.teacherName || ''}
                          onChange={(val) => {
                            const found = allTeachers.find((t) => formatTeacherDisplayName(t) === val || (t.name || '').trim() === val);
                            updatePeriodRow(period.id, {
                              teacherName: val,
                              teacherId: found?.id ? String(found.id) : period.teacherId,
                            });
                          }}
                          options={[
                            { value: '', label: 'Select Teacher' },
                            ...allTeachers.map((t) => {
                              const label = formatTeacherDisplayName(t);
                              return {
                                value: label,
                                label,
                              };
                            }),
                          ]}
                          className="w-44 min-w-[160px] shrink-0 text-xs"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removePeriodRow(period.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Budget & Refreshments */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              {/* Class Budget Items */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-foreground">Class Income & Expense Budget</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addBudgetRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Budget Item
                  </Button>
                </div>

                {(classDraft.budgets || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No budget items logged. Track income or expenses directly allocated to this class.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(classDraft.budgets || []).map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <FormSelect
                          id={`budget-type-${b.id}`}
                          name="budgetType"
                          value={b.budgetType}
                          onChange={(val) => updateBudgetRow(b.id, { budgetType: val as 'income' | 'expense' })}
                          options={[
                            { value: 'income', label: '+ Income' },
                            { value: 'expense', label: '- Expense' },
                          ]}
                          className="w-28 text-xs"
                        />
                        <Input
                          placeholder="Detail / Purpose"
                          value={b.detail}
                          onChange={(e) => updateBudgetRow(b.id, { detail: e.target.value })}
                          className="flex-1 text-xs"
                        />
                        <div className="relative w-32">
                          {currencySymbol && (
                            <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                          )}
                          <Input
                            type="number"
                            min={0}
                            value={b.amount ?? 0}
                            onChange={(e) => updateBudgetRow(b.id, { amount: parseFloat(e.target.value) || 0 })}
                            className={cn("text-xs", currencySymbol && "ps-6")}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeBudgetRow(b.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refreshments */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    <h4 className="text-sm font-semibold text-foreground">Class Refreshments & Tabarruk</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={addRefreshmentRow} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add Refreshment
                  </Button>
                </div>

                {(classDraft.refreshments || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-2 text-center">
                    No refreshment logs for this class.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(classDraft.refreshments || []).map((r) => (
                      <div key={r.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Input
                          type="date"
                          value={r.date.slice(0, 10)}
                          onChange={(e) => updateRefreshmentRow(r.id, { date: e.target.value })}
                          className="w-32 text-xs"
                        />
                        <Input
                          placeholder="Item (e.g. Juice, Biscuits)"
                          value={r.item}
                          onChange={(e) => updateRefreshmentRow(r.id, { item: e.target.value })}
                          className="flex-1 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          min={0}
                          value={r.quantity ?? 0}
                          onChange={(e) => updateRefreshmentRow(r.id, { quantity: parseInt(e.target.value, 10) || 0 })}
                          className="w-16 text-xs"
                        />
                        <div className="relative w-24">
                          {currencySymbol && (
                            <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                          )}
                          <Input
                            type="number"
                            placeholder="Price"
                            min={0}
                            value={r.pricePerUnit ?? 0}
                            onChange={(e) => updateRefreshmentRow(r.id, { pricePerUnit: parseFloat(e.target.value) || 0 })}
                            className={cn("text-xs", currencySymbol && "ps-6")}
                          />
                        </div>
                        <div className="relative w-24">
                          {currencySymbol && (
                            <span className="absolute start-2.5 top-2 text-xs text-muted-foreground">{currencySymbol}</span>
                          )}
                          <Input
                            type="number"
                            placeholder="Paid"
                            min={0}
                            value={r.paidAmount ?? 0}
                            onChange={(e) => updateRefreshmentRow(r.id, { paidAmount: parseFloat(e.target.value) || 0 })}
                            className={cn("text-xs", currencySymbol && "ps-6")}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeRefreshmentRow(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Scholarships & Eligibility */}
          {activeTab === 'scholarship' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-foreground">Scholarship Rate & Terms</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={FORM_LABEL} htmlFor="sch-pct">Scholarship Coverage Percentage (%)</label>
                    <div className="relative">
                      <Input
                        id="sch-pct"
                        type="number"
                        min={0}
                        max={100}
                        value={activeScholarship.percentage ?? 0}
                        onChange={(e) => updateScholarship({ percentage: parseFloat(e.target.value) || 0 })}
                        className="pe-6"
                      />
                      <span className="absolute end-3 top-2.5 text-xs text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div>
                    <label className={FORM_LABEL} htmlFor="sch-expiry">Expiry / Renewal Date</label>
                    <Input
                      id="sch-expiry"
                      type="date"
                      value={activeScholarship.expiryDate || ''}
                      onChange={(e) => updateScholarship({ expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Eligibility Matrix */}
              <div className="rounded-xl border border-border/70 bg-card p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Scholarship Eligibility Criteria</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(activeScholarship.eligibility?.orphan)}
                      onChange={(e) => updateEligibility({ orphan: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">Orphan Student</p>
                      <p className="text-[11px] text-muted-foreground">Eligible for full sponsorship</p>
                    </div>
                  </label>

                  <div>
                    <label className={FORM_LABEL} htmlFor="residence-type">Residence Status</label>
                    <FormSelect
                      id="residence-type"
                      name="residence"
                      value={activeScholarship.eligibility?.residence || 'rental'}
                      onChange={(val) => updateEligibility({ residence: val })}
                      options={[
                        { value: 'rental', label: 'Rented Accommodation' },
                        { value: 'owned', label: 'Self-Owned House' },
                        { value: 'relative', label: 'Staying with Relatives' },
                        { value: 'other', label: 'Other' },
                      ]}
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={FORM_LABEL} htmlFor="family-members">Family Members</label>
                    <Input
                      id="family-members"
                      type="number"
                      min={0}
                      value={activeScholarship.eligibility?.familyMembers ?? 0}
                      onChange={(e) => updateEligibility({ familyMembers: parseInt(e.target.value, 10) || 0 })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className={FORM_LABEL} htmlFor="earning-members">Earning Members</label>
                    <Input
                      id="earning-members"
                      type="number"
                      min={0}
                      value={activeScholarship.eligibility?.onJobMembers ?? 0}
                      onChange={(e) => updateEligibility({ onJobMembers: parseInt(e.target.value, 10) || 0 })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className={FORM_LABEL} htmlFor="studying-siblings">School-Going Siblings</label>
                    <Input
                      id="studying-siblings"
                      type="number"
                      min={0}
                      value={activeScholarship.eligibility?.schoolGoingSiblings ?? 0}
                      onChange={(e) => updateEligibility({ schoolGoingSiblings: parseInt(e.target.value, 10) || 0 })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}
