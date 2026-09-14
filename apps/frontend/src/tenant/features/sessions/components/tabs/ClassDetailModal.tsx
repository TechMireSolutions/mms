/**
 * @file ClassDetailModal.tsx
 * @description Orchestrator FormModal for configuring Class General Rules, Fees, Schedules, Budgets, and Scholarships.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Calendar, Coffee, Award, Wallet } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersContractList, useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { TEACHERS_MODULE_MANIFEST, type Teacher } from '@mms/shared';
import type { Class } from '@/lib/data/sessionsData';
import {
  type ClassDetailTabId,
  type ClassDetailTabItem,
  formatTeacherDisplayName,
  useClassDetailDraft,
  ClassDetailGeneralTab,
  ClassDetailFeesTab,
  ClassDetailScheduleTab,
  ClassDetailBudgetTab,
  ClassDetailScholarshipTab,
} from './class-detail';

interface ClassDetailModalProps {
  open: boolean;
  sessionClass: Class | null;
  onClose: () => void;
  onSave: (updatedClass: Class) => void | Promise<void>;
  saving?: boolean;
}

const TABS: readonly ClassDetailTabItem[] = [
  { id: 'general', label: 'General & Rules', icon: GraduationCap },
  { id: 'fees', label: 'Fees & Discounts', icon: Wallet },
  { id: 'schedule', label: 'Schedule & Timetable', icon: Calendar },
  { id: 'budget', label: 'Budget & Refreshment', icon: Coffee },
  { id: 'scholarship', label: 'Scholarships', icon: Award },
];

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
  const [activeTab, setActiveTab] = useState<ClassDetailTabId>('general');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: teachersData } = useTeachersContractList(
    { page: 1, limit: TEACHERS_MODULE_MANIFEST.maxPageSize, status: 'active' },
    open,
  );
  const teachersList = (teachersData?.body?.teachers ?? []) as Teacher[];

  const initialTeacherId = sessionClass?.teacherId;
  const { data: selectedTeachersData } = useTeachersByIds(
    initialTeacherId ? [initialTeacherId] : [],
  );
  const selectedTeachers = (selectedTeachersData ?? []) as Teacher[];

  const allTeachers = useMemo(() => {
    const map = new Map<string, Teacher>();
    for (const teacher of teachersList) {
      if (teacher?.id) map.set(String(teacher.id), teacher);
    }
    for (const teacher of selectedTeachers) {
      if (teacher?.id && !map.has(String(teacher.id))) {
        map.set(String(teacher.id), teacher);
      }
    }
    return Array.from(map.values());
  }, [teachersList, selectedTeachers]);

  const {
    classDraft,
    updateDraft,
    addFeeRow,
    removeFeeRow,
    updateFeeRow,
    addDiscountRow,
    removeDiscountRow,
    updateDiscountRow,
    addScheduleRow,
    removeScheduleRow,
    updateScheduleRow,
    activeTimetable,
    addPeriodRow,
    removePeriodRow,
    updatePeriodRow,
    addBudgetRow,
    removeBudgetRow,
    updateBudgetRow,
    addRefreshmentRow,
    removeRefreshmentRow,
    updateRefreshmentRow,
    activeScholarship,
    updateScholarship,
    updateEligibility,
  } = useClassDetailDraft({ open, sessionClass, allTeachers });

  useEffect(() => {
    if (open) {
      setActiveTab('general');
      setErrors({});
    }
  }, [open, sessionClass]);

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

    let resolvedTeacherName = classDraft.teacherName;
    if (classDraft.teacherId) {
      const teacher = allTeachers.find((t) => String(t.id) === String(classDraft.teacherId));
      if (teacher) {
        resolvedTeacherName = formatTeacherDisplayName(teacher) || resolvedTeacherName;
      }
    }

    await onSave({ ...classDraft, teacherName: resolvedTeacherName });
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
          {activeTab === 'general' && (
            <ClassDetailGeneralTab
              classDraft={classDraft}
              updateDraft={updateDraft}
              errors={errors}
              allTeachers={allTeachers}
            />
          )}

          {activeTab === 'fees' && (
            <ClassDetailFeesTab
              fees={classDraft.fees || []}
              discounts={classDraft.discounts || []}
              currencySymbol={currencySymbol}
              onAddFee={addFeeRow}
              onRemoveFee={removeFeeRow}
              onUpdateFee={updateFeeRow}
              onAddDiscount={addDiscountRow}
              onRemoveDiscount={removeDiscountRow}
              onUpdateDiscount={updateDiscountRow}
            />
          )}

          {activeTab === 'schedule' && (
            <ClassDetailScheduleTab
              schedules={classDraft.schedules || []}
              periods={activeTimetable.periods || []}
              allTeachers={allTeachers}
              onAddSchedule={addScheduleRow}
              onRemoveSchedule={removeScheduleRow}
              onUpdateSchedule={updateScheduleRow}
              onAddPeriod={addPeriodRow}
              onRemovePeriod={removePeriodRow}
              onUpdatePeriod={updatePeriodRow}
            />
          )}

          {activeTab === 'budget' && (
            <ClassDetailBudgetTab
              budgets={classDraft.budgets || []}
              refreshments={classDraft.refreshments || []}
              currencySymbol={currencySymbol}
              onAddBudget={addBudgetRow}
              onRemoveBudget={removeBudgetRow}
              onUpdateBudget={updateBudgetRow}
              onAddRefreshment={addRefreshmentRow}
              onRemoveRefreshment={removeRefreshmentRow}
              onUpdateRefreshment={updateRefreshmentRow}
            />
          )}

          {activeTab === 'scholarship' && (
            <ClassDetailScholarshipTab
              scholarship={activeScholarship}
              onUpdateScholarship={updateScholarship}
              onUpdateEligibility={updateEligibility}
            />
          )}
        </div>
      </div>
    </FormModal>
  );
}
