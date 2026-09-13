import React, { useMemo, useState } from "react";
import { Minus, QrCode, Type, Search, Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemplateFieldDefinition } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorElementPaletteProps<TPayload = Record<string, unknown>> {
  availableFields?: TemplateFieldDefinition<TPayload>[];
  onAddStaticText: () => void;
  onAddDivider: () => void;
  onAddQrCode: () => void;
  onAddField: (fieldOption: TemplateFieldDefinition<TPayload>) => void;
  t: TranslationFunction;
}

export function TemplateEditorElementPalette<TPayload = Record<string, unknown>>({
  availableFields = [],
  onAddStaticText,
  onAddDivider,
  onAddQrCode,
  onAddField,
  t,
}: TemplateEditorElementPaletteProps<TPayload>): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFields = useMemo(
    () =>
      availableFields.filter(
        (f) =>
          f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(f.field).toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [availableFields, searchQuery]
  );

  return (
    <aside className="max-h-56 w-full shrink-0 space-y-4 overflow-y-auto border-b border-border bg-card p-3 lg:max-h-none lg:w-56 lg:border-b-0 lg:border-e">
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border/60">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0">
            {t("templateEditor.addElements")}
          </p>
          <span className="text-[10px] text-muted-foreground/80 font-mono">Primitives</span>
        </div>
        <div className="space-y-1.5">
          <Button
            type="button"
            onClick={onAddStaticText}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.staticText")}</span>
            </div>
            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </Button>

          <Button
            type="button"
            onClick={onAddDivider}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.divider")}</span>
            </div>
            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
          </Button>

          <Button
            type="button"
            onClick={onAddQrCode}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-sky-500/10 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.qrCode")}</span>
            </div>
            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-sky-600" />
          </Button>
        </div>
      </div>

      {availableFields.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
            <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest m-0 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>{t("templateEditor.addFields")}</span>
            </p>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full">
              {availableFields.length}
            </span>
          </div>

          {availableFields.length > 5 && (
            <div className="relative">
              <Search className="w-3 h-3 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter fields..."
                className="w-full ps-8 pe-2 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="space-y-1 max-h-64 overflow-y-auto pe-0.5">
            {filteredFields.map((fieldOption) => (
              <Button
                type="button"
                key={String(fieldOption.field)}
                onClick={() => onAddField(fieldOption)}
                variant="outline"
                className="w-full text-start min-h-11 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="truncate">
                  <p className="truncate font-medium m-0">{fieldOption.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono m-0 truncate">
                    {`{${String(fieldOption.field)}}`}
                  </p>
                </div>
                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
              </Button>
            ))}
            {filteredFields.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Search className="w-4 h-4 text-muted-foreground/40 mb-1" aria-hidden="true" />
                <p className="text-xs text-muted-foreground m-0">No fields matched</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
