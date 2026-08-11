import type { Dispatch, JSX, SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { ModuleClearFiltersButton } from '@/components/ui/ModuleClearFiltersButton';
import { FilterChips } from '@/components/ui/FilterChips';
import { SearchBar } from '@/components/ui/SearchBar';
import { WorkViewModeToggle } from '@/components/ui/WorkViewModeToggle';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { QuestionBankFiltersMenuButton } from '@/tenant/features/question-bank/components/QuestionBankFiltersMenuButton';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

export const QUESTION_BANK_WORK_SEARCH_INPUT_ID = 'question-bank-work-search';

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
  const clearFilters = () => {
    onFilterCatsChange([]);
    onFilterDiffChange([]);
  };
  const activeFilterCount = filterCats.length + filterDiff.length;

  const categoryChips = filterCats.map((categoryId) => {
    const category = config.categories.find((item) => item.id === categoryId);
    return {
      key: `category:${categoryId}`,
      label: category ? `${category.icon} ${category.name}` : categoryId,
      onRemove: () => toggleCategory(categoryId),
    };
  });
  const difficultyChips = filterDiff.map((difficulty) => ({
    key: `difficulty:${difficulty}`,
    label: config.difficultyLabel(difficulty),
    onRemove: () => toggleDifficulty(difficulty),
  }));

  return (
    <>
      <div className={cn(WORK_SURFACE, 'flex flex-col gap-3 p-3 sm:flex-row')}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={QUESTION_BANK_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t('questionBank.searchPlaceholder')}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <QuestionBankFiltersMenuButton
            config={config}
            filterCats={filterCats}
            filterDiff={filterDiff}
            activeFilterCount={activeFilterCount}
            onToggleCategory={toggleCategory}
            onToggleDifficulty={toggleDifficulty}
            onClearFilters={clearFilters}
          />

          {activeFilterCount > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={clearFilters}
              label={t('questionBank.clearFilters')}
            />
          ) : null}

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
      </div>

      <FilterChips chips={[...categoryChips, ...difficultyChips]} onClearAll={clearFilters} />
    </>
  );
}
