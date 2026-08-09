import type { Dispatch, JSX, SetStateAction } from 'react';
import { Filter, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ModuleFilterCheckboxGroup,
  ModuleFilterDropdown,
} from '@/components/ui/ModuleFiltersMenuButton';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

interface QuestionBankToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  config: QuestionBankConfig;
  search: string;
  filterCats: string[];
  filterDiff: string[];
  hideToolbarAdd: boolean;
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onFilterCatsChange: Dispatch<SetStateAction<string[]>>;
  onFilterDiffChange: Dispatch<SetStateAction<string[]>>;
  onAddQuestion: () => void;
}

export function QuestionBankToolbar({
  viewMode,
  onViewModeChange,
  config,
  search,
  filterCats,
  filterDiff,
  hideToolbarAdd,
  canWrite,
  showDeleted,
  columnCustomizer,
  onSearchChange,
  onFilterCatsChange,
  onFilterDiffChange,
  onAddQuestion,
}: QuestionBankToolbarProps): JSX.Element {
  const { t } = useTranslation();

  const toggleCategory = (categoryId: string) =>
    onFilterCatsChange((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId],
    );
  const toggleDifficulty = (difficulty: string) =>
    onFilterDiffChange((previous) =>
      previous.includes(difficulty)
        ? previous.filter((id) => id !== difficulty)
        : [...previous, difficulty],
    );

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('questionBank.searchPlaceholder')}
          aria-label={t('questionBank.searchPlaceholder')}
          className="w-full rounded-xl border border-border bg-card py-2.5 ps-10 pe-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSearchChange('')}
            aria-label={t('questionBank.clearSearch')}
            className="absolute end-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 text-muted-foreground hover:bg-transparent"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </div>
      {config.isFieldEnabled('categoryId') && config.categories.length > 0 && (
        <ModuleFilterDropdown
          label={t('questionBank.category')}
          activeCount={filterCats.length}
          icon={Filter}
          clearLabel={t('common.clearFilters')}
          onClear={() => onFilterCatsChange([])}
          contentClassName="w-48"
        >
          <ModuleFilterCheckboxGroup
            label={t('questionBank.filterByCategory')}
            options={config.categories.map((category) => ({
              value: category.id,
              label: `${category.icon} ${category.name}`,
            }))}
            selected={filterCats}
            onToggle={toggleCategory}
          />
        </ModuleFilterDropdown>
      )}
      {config.isFieldEnabled('difficulty') && config.enabledDifficulties.length > 0 && (
        <ModuleFilterDropdown
          label={t('questionBank.filterDifficulty')}
          activeCount={filterDiff.length}
          icon={Filter}
          clearLabel={t('common.clearFilters')}
          onClear={() => onFilterDiffChange([])}
          contentClassName="w-36"
        >
          <ModuleFilterCheckboxGroup
            label={t('questionBank.filterDifficulty')}
            options={config.enabledDifficulties.map((difficulty) => ({
              value: difficulty,
              label: config.difficultyLabel(difficulty),
            }))}
            selected={filterDiff}
            onToggle={toggleDifficulty}
          />
        </ModuleFilterDropdown>
      )}
      {!hideToolbarAdd && canWrite && !showDeleted && (
        <Button
          type="button"
          onClick={onAddQuestion}
          className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.addQuestion')}
        </Button>
      )}
      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      {columnCustomizer && (
        <ModuleColumnCustomizer
          columnRegistry={columnCustomizer.columnRegistry}
          updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
          labels={columnCustomizer.labels}
        />
      )}
    </div>
  );
}