import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { createQuestionCategory, type AppTranslationKey, type QuestionCategory } from '@mms/shared';
import { persistQuestionCategory } from '@/lib/data/questionBankCategories';
import { FORM_INPUT } from '@/components/ui/formStyles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CategorySelectorProps {
  categories: QuestionCategory[];
  multiple?: boolean;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  onCategoriesUpdated?: (categories: QuestionCategory[]) => void;
  required?: boolean;
  /** When set (e.g. question language ≠ system UI), category UI uses this translator. */
  translate?: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}

function toSelectedIds(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function CategorySelector({
  categories,
  multiple = false,
  value,
  onChange,
  onCategoriesUpdated,
  required = false,
  translate,
}: CategorySelectorProps): React.JSX.Element {
  const { t: globalT } = useTranslation();
  const t = translate ?? globalT;
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const selectedIds = toSelectedIds(value);

  const filtered = useMemo(() => {
    const searchQuery = search.trim().toLowerCase();
    if (!searchQuery) return categories;
    return categories.filter(
      (category) => category.name.toLowerCase().includes(searchQuery) || category.id.toLowerCase().includes(searchQuery),
    );
  }, [categories, search]);

  const applySelection = (nextIds: string[]): void => {
    if (multiple) {
      onChange(nextIds);
      return;
    }
    onChange(nextIds[0] ?? '');
  };

  const toggleCategory = (categoryId: string): void => {
    if (!multiple) {
      applySelection([categoryId]);
      return;
    }
    const selectedCategoryIds = selectedIds.includes(categoryId)
      ? selectedIds.filter((selectedId) => selectedId !== categoryId)
      : [...selectedIds, categoryId];
    applySelection(selectedCategoryIds);
  };

  const handleCreate = (): void => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const existingByName = categories.find(
      (category) => category.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (existingByName) {
      toggleCategory(existingByName.id);
      setNewName('');
      setShowCreate(false);
      return;
    }
    const created = createQuestionCategory(trimmed, categories);
    const updatedCategories = persistQuestionCategory(created);
    onCategoriesUpdated?.(updatedCategories);
    if (multiple) {
      applySelection([...selectedIds, created.id]);
    } else {
      applySelection([created.id]);
    }
    setNewName('');
    setShowCreate(false);
    setSearch('');
  };

  return (
    <div className="space-y-2">
      {multiple && (
        <p className="text-[11px] text-muted-foreground">{t('questionBank.categoriesMultiHint')}</p>
      )}
      <Input
        type="search"
        className={`${FORM_INPUT} shadow-none`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('questionBank.categorySearch')}
        aria-label={t('questionBank.categorySearch')}
      />

      {filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('questionBank.noCategories')}</p>
      ) : (
        <div
          className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 p-2"
          role="listbox"
          aria-label={t('questionBank.category')}
          aria-required={required}
          aria-multiselectable={multiple}
        >
          {filtered.map((cat) => {
            const selected = selectedIds.includes(cat.id);
            return (
              <Button
                key={cat.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 h-auto text-xs font-semibold shadow-none transition-colors ${
                  selected
                    ? 'border-transparent text-white'
                    : 'border-border bg-card text-foreground hover:bg-muted'
                }`}
                style={selected ? { background: cat.color, borderColor: cat.color } : undefined}
              >
                <span aria-hidden>{cat.icon}</span>
                <span>{cat.name}</span>
              </Button>
            );
          })}
        </div>
      )}

      {multiple && selectedIds.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {t('questionBank.categoriesSelected', { count: selectedIds.length })}
        </p>
      )}

      {showCreate ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3 sm:flex-row">
          <Input
            type="text"
            className={`${FORM_INPUT} shadow-none`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('questionBank.newCategoryName')}
            aria-label={t('questionBank.newCategoryName')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="rounded-lg bg-primary h-auto px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {t('questionBank.createCategory')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setNewName('');
              }}
              variant="outline"
              className="rounded-lg border border-border h-auto px-3 py-2 text-xs font-medium hover:bg-muted shadow-none"
            >
              {t('questionBank.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setShowCreate(true)}
          variant="outline"
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border h-auto text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground shadow-none"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.createCategory')}
        </Button>
      )}
    </div>
  );
}
