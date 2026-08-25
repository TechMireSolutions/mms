import type { Dispatch, JSX, SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ModuleColumnCustomizerProps } from '@/components/ui/ModuleColumnCustomizer';
import { FilterChips } from '@/components/ui/FilterChips';
import { ModuleWorkToolbar } from '@/components/ui/ModuleWorkToolbar';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import { useTranslation } from '@/hooks/useTranslation';
import { QuestionBankFiltersMenuButton } from '@/tenant/features/question-bank/components/QuestionBankFiltersMenuButton';
import type { useQuestionBankConfig } from '@/tenant/features/question-bank/hooks/useQuestionBankConfig';

type QuestionBankConfig = ReturnType<typeof useQuestionBankConfig>;

export const QUESTION_BANK_WORK_SEARCH_INPUT_ID = 'question-bank-work-search';

interface QuestionBankListFiltersProps {
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

export function QuestionBankListFilters({
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
}: QuestionBankListFiltersProps): JSX.Element {
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
      <ModuleWorkToolbar
        regionLabel={t('page.questionBank.title')}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('questionBank.searchPlaceholder')}
        searchId={QUESTION_BANK_WORK_SEARCH_INPUT_ID}
        hasActiveFilters={activeFilterCount > 0}
        onClearFilters={clearFilters}
        clearFiltersLabel={t('questionBank.clearFilters')}
        filterButton={
          <QuestionBankFiltersMenuButton
            config={config}
            filterCats={filterCats}
            filterDiff={filterDiff}
            activeFilterCount={activeFilterCount}
            onToggleCategory={toggleCategory}
            onToggleDifficulty={toggleDifficulty}
            onClearFilters={clearFilters}
          />
        }
        primaryAction={
          !hideToolbarAdd && canWrite && !showDeleted ? (
            <Button
              type="button"
              onClick={onAddQuestion}
              className="flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t('questionBank.addQuestion')}
            </Button>
          ) : undefined
        }
        viewModeToggle={{
          viewMode,
          onViewModeChange,
        }}
        columnCustomizer={columnCustomizer ? {
          registry: columnCustomizer.columnRegistry,
          onUpdate: columnCustomizer.updateUserColumnLayout,
          onReset: columnCustomizer.onResetLayout,
          labels: columnCustomizer.labels,
        } : undefined}
      />

      <FilterChips chips={[...categoryChips, ...difficultyChips]} onClearAll={clearFilters} />
    </>
  );
}
