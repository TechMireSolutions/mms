import type { Dispatch, JSX, SetStateAction } from 'react';
import { ChevronDown, Filter, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterCats.length ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              {t('questionBank.category')}
              {filterCats.length > 0 && ` (${filterCats.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border border-border bg-card p-1 shadow-lg">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
              {t('questionBank.filterByCategory')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 h-px bg-border" />
            {config.categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category.id}
                checked={filterCats.includes(category.id)}
                onCheckedChange={() =>
                  onFilterCatsChange((previousCategoryIds) => (
                    previousCategoryIds.includes(category.id)
                      ? previousCategoryIds.filter((categoryId) => categoryId !== category.id)
                      : [...previousCategoryIds, category.id]
                  ))
                }
                className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
              >
                {category.icon} {category.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {config.isFieldEnabled('difficulty') && config.enabledDifficulties.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium ${filterDiff.length ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10' : 'border-border bg-card hover:bg-muted'}`}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              {t('questionBank.filterDifficulty')}
              {filterDiff.length > 0 && ` (${filterDiff.length})`}
              <ChevronDown className="h-3 w-3" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl border border-border bg-card p-1 shadow-lg">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold">
              {t('questionBank.filterDifficulty')}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 h-px bg-border" />
            {config.enabledDifficulties.map((difficulty) => (
              <DropdownMenuCheckboxItem
                key={difficulty}
                checked={filterDiff.includes(difficulty)}
                onCheckedChange={() =>
                  onFilterDiffChange((previousDifficulties) => (
                    previousDifficulties.includes(difficulty)
                      ? previousDifficulties.filter((selectedDifficulty) => selectedDifficulty !== difficulty)
                      : [...previousDifficulties, difficulty]
                  ))
                }
                className="cursor-pointer rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
              >
                {config.difficultyLabel(difficulty)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
