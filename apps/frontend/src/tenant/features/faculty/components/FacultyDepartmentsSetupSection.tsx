import React from 'react';
import { Building2, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/ui/SectionCard';
import { FacultyDepartmentsTable } from './FacultyDepartmentsTable';
import {
  slugifyDepartmentCode,
  useFacultyDepartmentsController,
} from '../hooks/useFacultyDepartmentsController';

/** Normalized department catalog management using the faculty_departments table. */
export function FacultyDepartmentsSetupSection(): React.JSX.Element {
  const {
    t,
    departments,
    orderedDepartments,
    parentOptions,
    isLoading,
    isPending,
    editingDepartment,
    name,
    setName,
    code,
    setCode,
    parentId,
    setParentId,
    handleStartEdit,
    handleCancelEdit,
    handleSubmit,
    handleDelete,
  } = useFacultyDepartmentsController();

  return (
    <SectionCard title={t('faculty.setup.departmentsTitle')} icon={Building2} accentColor="primary">
      <div className="space-y-4 text-start">
        <p className="text-sm text-muted-foreground">{t('faculty.setup.departmentsHint')}</p>

        {editingDepartment && (
          <div className="flex items-center justify-between rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
            <span className="font-medium text-primary">
              {t('faculty.setup.editDepartment')}: {editingDepartment.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="h-6 gap-1 px-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" aria-hidden />
              <span>{t('common.cancel')}</span>
            </Button>
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-end">
            <div className="space-y-1 sm:col-span-5">
              <label htmlFor="new-faculty-department-name" className="text-xs font-medium text-muted-foreground">
                {t('faculty.setup.departmentName')}
              </label>
              <Input
                id="new-faculty-department-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!code && !editingDepartment) setCode(slugifyDepartmentCode(e.target.value));
                }}
                placeholder={t('faculty.setup.departmentNamePlaceholder')}
                className={FORM_INPUT}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1 sm:col-span-3">
              <label htmlFor="new-faculty-department-code" className="text-xs font-medium text-muted-foreground">
                {t('faculty.setup.departmentCode')}
              </label>
              <Input
                id="new-faculty-department-code"
                value={code}
                onChange={(e) => setCode(slugifyDepartmentCode(e.target.value))}
                placeholder={t('faculty.setup.departmentCodePlaceholder')}
                className={FORM_INPUT}
                maxLength={32}
                disabled={isPending}
              />
            </div>

            <div className="space-y-1 sm:col-span-4">
              <label htmlFor="faculty-department-parent" className="text-xs font-medium text-muted-foreground">
                {t('faculty.setup.parentDepartment')}
              </label>
              <FormSelect
                id="faculty-department-parent"
                value={parentId}
                onChange={setParentId}
                options={parentOptions}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingDepartment && (
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isPending} className="min-h-11">
                {t('common.cancel')}
              </Button>
            )}
            <Button type="submit" className="min-h-11 gap-1.5" disabled={isPending || !name.trim()}>
              {editingDepartment ? (
                <>
                  <Check className="size-4" aria-hidden />
                  <span>{t('faculty.setup.updateDepartment')}</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden />
                  <span>{t('faculty.setup.addDepartment')}</span>
                </>
              )}
            </Button>
          </div>
        </form>

        <FacultyDepartmentsTable
          departments={departments}
          orderedDepartments={orderedDepartments}
          editingDepartmentId={editingDepartment?.id}
          isPending={isPending}
          isLoading={isLoading}
          onEdit={handleStartEdit}
          onDelete={(d) => void handleDelete(d)}
        />
      </div>
    </SectionCard>
  );
}
