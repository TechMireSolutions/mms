import { motion } from 'framer-motion';
import { ChevronDown, Filter } from 'lucide-react';
import type { ModuleColumnRegistryEntry, TeachersListPageResult } from '@mms/shared';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterChips } from '@/components/ui/FilterChips';
import { ListPagination } from '@/components/ui/ListPagination';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from '@/components/ui/ModuleColumnCustomizer';
import { ModuleTrashToggle } from '@/components/ui/ModuleTrashToggle';
import { SearchBar } from '@/components/ui/SearchBar';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { useTranslation } from '@/hooks/useTranslation';
import type { Teacher } from '@/lib/data/teachersData';
import { TeacherList, type TeacherSortField } from '@/tenant/features/teachers/components/TeacherList';
import { teacherStatusLabel } from '@/tenant/features/teachers/teacherPageUtils';

interface TeachersWorkTierProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canWrite: boolean;
  canDelete: boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels: ModuleColumnCustomizerLabels;
  teachers: Teacher[];
  workPageData?: TeachersListPageResult;
  isWorkPageLoading: boolean;
  isWorkPageError: boolean;
  isWorkPageFetching: boolean;
  useServerWork: boolean;
  selectionResetKey: string;
  sortField: TeacherSortField;
  sortDir: 'asc' | 'desc';
  isColumnVisible: (key: string) => boolean;
  getColumnWidth: (key: string) => number | undefined;
  onColumnResize: (key: string, width: number) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
  onRetry: () => unknown;
  onEdit: (teacher: Teacher) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkRestore: (ids: string[]) => void;
  onBulkStatusChange?: (ids: string[], status: string) => void;
  onWhatsApp?: (teachers: Teacher[]) => void;
  onSms?: (teachers: Teacher[]) => void;
  onEmail?: (teachers: Teacher[]) => void;
  onSortChange: (field: TeacherSortField, dir: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
}

export function TeachersWorkTier({
  search,
  filterStatus,
  filterSpecialization,
  statusOptions,
  specializationOptions,
  showDeleted,
  canWrite,
  canDelete,
  columnRegistry,
  updateUserColumnLayout,
  customizerLabels,
  teachers,
  workPageData,
  isWorkPageLoading,
  isWorkPageError,
  isWorkPageFetching,
  useServerWork,
  selectionResetKey,
  sortField,
  sortDir,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  onSearchChange,
  onToggleStatus,
  onSpecializationChange,
  onToggleDeleted,
  onClearFilters,
  onRetry,
  onEdit,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onBulkStatusChange,
  onWhatsApp,
  onSms,
  onEmail,
  onSortChange,
  onPageChange,
}: TeachersWorkTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const filterChips = [
    ...filterStatus.map((status) => ({
      key: status,
      label: teacherStatusLabel(t, status),
      onRemove: () => onToggleStatus(status),
    })),
    ...(filterSpecialization
      ? [{
          key: 'specialization',
          label: filterSpecialization,
          onRemove: () => onSpecializationChange(''),
        }]
      : []),
  ];

  return (
    <motion.div
      key="work"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="space-y-5"
    >
      <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={t('teachers.searchPlaceholder')}
          className="flex-1"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
                filterStatus.length > 0
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              {t('teachers.filter.status')}
              {filterStatus.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {filterStatus.length}
                </span>
              )}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">{t('teachers.filter.status')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filterStatus.includes(status)}
                onCheckedChange={() => onToggleStatus(status)}
              >
                {teacherStatusLabel(t, status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
                filterSpecialization
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {filterSpecialization || t('teachers.filter.specialization')}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={filterSpecialization}
              onValueChange={onSpecializationChange}
            >
              <DropdownMenuRadioItem value="">
                {t('teachers.filter.allSpecializations')}
              </DropdownMenuRadioItem>
              {specializationOptions.map((specialization) => (
                <DropdownMenuRadioItem key={specialization} value={specialization}>
                  {specialization}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModuleColumnCustomizer
          columnRegistry={columnRegistry}
          updateUserColumnLayout={updateUserColumnLayout}
          labels={customizerLabels}
        />

        {canDelete && (
          <ModuleTrashToggle
            showDeleted={showDeleted}
            onToggle={onToggleDeleted}
            showActiveLabel={t('teachers.showActive')}
            showDeletedLabel={t('teachers.showDeleted')}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
              showDeleted
                ? 'border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
          />
        )}
      </div>

      <FilterChips chips={filterChips} onClearAll={onClearFilters} />

      <ErrorBoundary>
        {isWorkPageLoading ? (
          <TableSkeleton rows={6} cols={columnRegistry.length} />
        ) : isWorkPageError ? (
          <ErrorState title={t('teachers.loadFailed')} onRetry={() => void onRetry()} />
        ) : (
          <>
            <TeacherList
              teachers={teachers}
              onEdit={onEdit}
              onDelete={onDelete}
              onRestore={onRestore}
              onBulkDelete={onBulkDelete}
              onBulkRestore={onBulkRestore}
              onBulkStatusChange={onBulkStatusChange}
              onWhatsApp={onWhatsApp}
              onSms={onSms}
              onEmail={onEmail}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              selectionResetKey={selectionResetKey}
              isColumnVisible={isColumnVisible}
              getColumnWidth={getColumnWidth}
              onColumnResize={onColumnResize}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={onSortChange}
            />
            {useServerWork && workPageData && (
              <ListPagination
                page={workPageData.page}
                total={workPageData.total}
                limit={workPageData.limit}
                hasMore={workPageData.hasMore}
                onPageChange={onPageChange}
                i18nNamespace="teachers"
                variant="range"
              />
            )}
            {useServerWork && isWorkPageFetching && (
              <p className="text-xs text-muted-foreground px-1">{t('common.loading')}</p>
            )}
          </>
        )}
      </ErrorBoundary>
    </motion.div>
  );
}
