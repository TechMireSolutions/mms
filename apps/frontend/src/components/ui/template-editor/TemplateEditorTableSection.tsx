import React from 'react';
import { Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TemplateElement } from '@mms/shared';
import type { TranslationFunction } from '@/lib/contexts/TranslationContext';

export interface TemplateEditorTableSectionProps<TFieldKey extends string = string> {
  selectedElement: TemplateElement<TFieldKey>;
  onPatchElement: (elementId: string, patch: Partial<TemplateElement<TFieldKey>>) => void;
  t: TranslationFunction;
}

export function TemplateEditorTableSection<TFieldKey extends string = string>({
  selectedElement,
  onPatchElement,
  t,
}: TemplateEditorTableSectionProps<TFieldKey>): React.JSX.Element {
  const existingCols = selectedElement.columns || [];

  const addColumn = () => {
    const newCols = [
      ...existingCols,
      {
        header: `Col ${existingCols.length + 1}`,
        field: `field_${existingCols.length + 1}`,
        width: 80,
        align: 'left' as const,
      },
    ];
    onPatchElement(selectedElement.id, { columns: newCols });
  };

  const updateColumn = (cIdx: number, patch: Partial<(typeof existingCols)[number]>) => {
    const newCols = [...existingCols];
    const col = newCols[cIdx];
    if (!col) return;
    newCols[cIdx] = { ...col, ...patch };
    onPatchElement(selectedElement.id, { columns: newCols });
  };

  const moveColumn = (cIdx: number, direction: 'up' | 'down') => {
    const newCols = [...existingCols];
    const targetIdx = direction === 'up' ? cIdx - 1 : cIdx + 1;
    if (targetIdx < 0 || targetIdx >= newCols.length) return;
    const temp = newCols[cIdx]!;
    newCols[cIdx] = newCols[targetIdx]!;
    newCols[targetIdx] = temp;
    onPatchElement(selectedElement.id, { columns: newCols });
  };

  const deleteColumn = (cIdx: number) => {
    const newCols = existingCols.filter((_, idx) => idx !== cIdx);
    onPatchElement(selectedElement.id, { columns: newCols });
  };

  return (
    <div className="pt-2 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0">
          {t('templateEditor.table')}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addColumn}
          className="min-h-8 h-8 px-2 text-3xs flex items-center gap-1 rounded"
          title={t('templateEditor.addColumn')}
          aria-label={t('templateEditor.addColumn')}
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          <span>{t('templateEditor.addColumn')}</span>
        </Button>
      </div>

      <div role="list" className="space-y-2">
        {existingCols.map((col, cIdx) => (
          <div
            role="listitem"
            key={cIdx}
            className="p-2 rounded-lg border border-border/70 bg-muted/20 space-y-1.5"
          >
            <div className="space-y-1">
              <Input
                type="text"
                value={col.header}
                placeholder={t('templateEditor.columnHeader')}
                aria-label={t('templateEditor.columnHeader')}
                onChange={(e) => updateColumn(cIdx, { header: e.target.value })}
                className="h-8 min-h-8 text-xs px-2 py-0.5"
              />
              <Input
                type="text"
                value={col.field}
                placeholder={t('templateEditor.columnField')}
                aria-label={t('templateEditor.columnField')}
                onChange={(e) => updateColumn(cIdx, { field: e.target.value })}
                className="h-8 min-h-8 text-xs px-2 py-0.5 font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-1">
                <span className="text-3xs text-muted-foreground font-semibold uppercase">W:</span>
                <Input
                  type="number"
                  min={20}
                  max={400}
                  value={col.width ?? 80}
                  aria-label="Column width"
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    if (!Number.isNaN(w)) {
                      updateColumn(cIdx, { width: Math.max(20, w) });
                    }
                  }}
                  className="h-7 min-h-7 text-xs px-1.5 py-0 w-14 font-mono"
                />
              </div>

              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={cIdx === 0}
                  onClick={() => moveColumn(cIdx, 'up')}
                  className="min-h-7 min-w-7 h-7 w-7 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
                  title={t('templateEditor.moveBackward')}
                  aria-label={t('templateEditor.moveBackward')}
                >
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={cIdx === existingCols.length - 1}
                  onClick={() => moveColumn(cIdx, 'down')}
                  className="min-h-7 min-w-7 h-7 w-7 text-muted-foreground hover:text-foreground rounded disabled:opacity-30"
                  title={t('templateEditor.moveForward')}
                  aria-label={t('templateEditor.moveForward')}
                >
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteColumn(cIdx)}
                  className="min-h-7 min-w-7 h-7 w-7 text-destructive hover:bg-destructive/10 rounded"
                  title={t('templateEditor.delete')}
                  aria-label={t('templateEditor.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
