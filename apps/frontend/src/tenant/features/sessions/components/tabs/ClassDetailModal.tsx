/**
 * @file ClassDetailModal.tsx
 * @description Orchestrator FormModal for configuring Class General Rules, Fees, Schedules, Budgets, and Scholarships.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Calendar, Coffee, Award, Wallet } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { useTranslation } from '@/hooks/useTranslation';
import { useTeachersContractList, useTeachersByIds } from '@/tenant/hooks/collections/teachers';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { TEACHERS_MODULE_MANIFEST, formatTeacherDisplayName, type Teacher } from '@mms/shared';
import type { Class } from '@/lib/data/sessionsData';
import {
  type ClassDetailTabId,
  type ClassDetailTabItem,
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
  { id: 'general', labelKey: 'sessions.classes.detail.tab.general', icon: GraduationCap },
  { id: 'fees', labelKey: 'sessions.classes.detail.tab.fees', icon: Wallet },
  { id: 'schedule', labelKey: 'sessions.classes.detail.tab.schedule', icon: Calendar },
  { id: 'budget', labelKey: 'sessions.classes.detail.tab.budget', icon: Coffee },
  { id: 'scholarship', labelKey: 'sessions.classes.detail.tab.scholarship', icon: Award },
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
  } = useClassDetailDraft({ open, sessionClass, allTeachers: teachersList });

  // Track the live draft teacher so a newly assigned teacher not present in the
  // active list is still resolved by id.
  const selectedTeacherId = classDraft.teacherId ? [classDraft.teacherId] : [];
  const { data: selectedTeachersData } = useTeachersByIds(selectedTeacherId);
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

  const subTabs = useMemo(
    () => TABS.map((tab) => ({ key: tab.id, label: t(tab.labelKey), icon: tab.icon })),
    [t],
  );

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
      const teacher = allTeachers.find((candidate) => String(candidate.id) === String(classDraft.teacherId));
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
      title={
        classDraft.name
          ? t('sessions.classes.detail.title', { name: classDraft.name })
          : t('sessions.classes.detail.newTitle')
      }
      icon={GraduationCap}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      onSave={handleSave}
      saving={saving}
      error={Object.values(errors)[0]}
    >
      <div className="max-w-3xl space-y-4">
        <SubTabBar tabs={subTabs} value={activeTab} onChange={setActiveTab} />

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
