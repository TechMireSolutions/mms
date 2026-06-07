import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { createQuestionCategory, type QuestionCategory } from '@mms/shared';

const INPUT =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20';

interface CategoryManagerProps {
  categories: QuestionCategory[];
  onChange: (categories: QuestionCategory[]) => void;
}

export default function CategoryManager({
  categories,
  onChange,
}: CategoryManagerProps): React.JSX.Element {
  const { t } = useTranslation();

  const update = (id: string, patch: Partial<QuestionCategory>): void => {
    onChange(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCategory = (): void => {
    onChange([...categories, createQuestionCategory(t('questionBank.newCategory'), categories)]);
  };

  const removeCategory = (id: string): void => {
    onChange(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t('questionBank.categoriesTitle')}
        </h4>
        <button
          type="button"
          onClick={addCategory}
          className="flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {t('questionBank.addCategory')}
        </button>
      </div>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="grid grid-cols-[auto_1fr_5rem_5rem_auto] items-center gap-2 rounded-lg border border-border/70 bg-muted/20 p-2"
          >
            <input
              type="text"
              className="w-12 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm"
              value={cat.icon}
              onChange={(e) => update(cat.id, { icon: e.target.value })}
              aria-label={t('questionBank.categoryIcon')}
            />
            <input
              type="text"
              className={INPUT}
              value={cat.name}
              onChange={(e) => update(cat.id, { name: e.target.value })}
              aria-label={t('questionBank.categoryName')}
            />
            <input
              type="color"
              className="h-9 w-full cursor-pointer rounded-lg border border-border bg-background"
              value={cat.color}
              onChange={(e) => update(cat.id, { color: e.target.value })}
              aria-label={t('questionBank.categoryColor')}
            />
            <span
              className="truncate rounded-full px-2 py-1 text-center text-[10px] font-bold text-white"
              style={{ background: cat.color }}
            >
              {cat.name}
            </span>
            <button
              type="button"
              onClick={() => removeCategory(cat.id)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t('questionBank.removeCategory')}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
