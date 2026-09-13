import React, { useMemo, useState } from "react";
import { Minus, QrCode, Type, Search, Database, Plus, Heading1, Image as ImageIcon, Table, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TemplateFieldDefinition } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorElementPaletteProps<TPayload = Record<string, unknown>> {
  availableFields?: TemplateFieldDefinition<TPayload>[];
  onAddStaticText: () => void;
  onAddHeading?: () => void;
  onAddDivider: () => void;
  onAddQrCode: () => void;
  onAddLogo?: () => void;
  onAddTable?: () => void;
  onAddField: (fieldOption: TemplateFieldDefinition<TPayload>) => void;
  t: TranslationFunction;
}

export function TemplateEditorElementPalette<TPayload = Record<string, unknown>>({
  availableFields = [],
  onAddStaticText,
  onAddHeading,
  onAddDivider,
  onAddQrCode,
  onAddLogo,
  onAddTable,
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
    <aside
      aria-label={t("templateEditor.addElements")}
      className="max-h-56 w-full shrink-0 space-y-4 overflow-y-auto border-b border-border bg-card p-3 lg:max-h-none lg:w-56 lg:border-b-0 lg:border-e select-none print:hidden"
    >
      <div>
        <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-border/70">
          <p className="text-xs font-bold uppercase text-foreground tracking-wider m-0 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>{t("templateEditor.addElements")}</span>
          </p>
          <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
            {t("templateEditor.primitives")}
          </span>
        </div>
        <div className="space-y-1.5">
          {onAddHeading && (
            <Button
              type="button"
              onClick={onAddHeading}
              variant="outline"
              className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-indigo-500 bg-card hover:bg-indigo-500/5 hover:border-indigo-400/50 hover:text-indigo-600 dark:hover:text-indigo-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Heading1 className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>{t("templateEditor.heading")}</span>
              </div>
              <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" aria-hidden="true" />
            </Button>
          )}

          <Button
            type="button"
            onClick={onAddStaticText}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-sky-500 bg-card hover:bg-sky-500/5 hover:border-sky-400/50 hover:text-sky-600 dark:hover:text-sky-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                <Type className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.staticText")}</span>
            </div>
            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-sky-500" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            onClick={onAddDivider}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-slate-400 bg-card hover:bg-slate-500/5 hover:border-slate-400/50 hover:text-slate-700 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-muted text-muted-foreground group-hover:bg-slate-500 group-hover:text-white transition-colors">
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.divider")}</span>
            </div>
            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            onClick={onAddQrCode}
            variant="outline"
            className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-emerald-500 bg-card hover:bg-emerald-500/5 hover:border-emerald-400/50 hover:text-emerald-600 dark:hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
              <span>{t("templateEditor.qrCode")}</span>
            </div>
            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </Button>

          {onAddLogo && (
            <Button
              type="button"
              onClick={onAddLogo}
              variant="outline"
              className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-amber-500 bg-card hover:bg-amber-500/5 hover:border-amber-400/50 hover:text-amber-600 dark:hover:text-amber-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>{t("templateEditor.logo")}</span>
              </div>
              <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </Button>
          )}

          {onAddTable && (
            <Button
              type="button"
              onClick={onAddTable}
              variant="outline"
              className="w-full text-start min-h-11 px-3 py-2 text-xs font-semibold rounded-lg border border-border border-s-[3px] border-s-teal-500 bg-card hover:bg-teal-500/5 hover:border-teal-400/50 hover:text-teal-600 dark:hover:text-teal-400 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
                  <Table className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <span>{t("templateEditor.table")}</span>
              </div>
              <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {availableFields.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between pb-1.5 border-b border-border/70">
            <p className="text-xs font-bold uppercase text-foreground tracking-wider m-0 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>{t("templateEditor.addFields")}</span>
            </p>
            <span className="text-3xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              {searchQuery ? `${filteredFields.length} / ${availableFields.length}` : availableFields.length}
            </span>
          </div>

          {availableFields.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchQuery("");
                }}
                placeholder={t("templateEditor.filterFieldsPlaceholder")}
                aria-label={t("templateEditor.filterFieldsPlaceholder")}
                className="w-full ps-8 pe-7 py-1 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-11"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={t("common.cancel")}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-sm focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          <div
            role="region"
            aria-live="polite"
            aria-label={t("templateEditor.addFields")}
            className="space-y-1 max-h-64 overflow-y-auto pe-0.5"
          >
            {filteredFields.map((fieldOption) => (
              <Button
                type="button"
                key={String(fieldOption.field)}
                onClick={() => onAddField(fieldOption)}
                variant="outline"
                className="w-full text-start min-h-11 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border border-s-[3px] border-s-primary/40 bg-card hover:bg-primary/5 hover:border-primary/50 hover:border-s-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="truncate">
                  <p className="truncate font-medium m-0">{fieldOption.label}</p>
                  <p className="text-2xs text-muted-foreground font-mono m-0 truncate">
                    <span dir="ltr" className="inline-block font-mono">
                      {`{${String(fieldOption.field)}}`}
                    </span>
                  </p>
                </div>
                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" aria-hidden="true" />
              </Button>
            ))}
            {filteredFields.length === 0 && (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <Search className="w-4 h-4 text-muted-foreground/40 mb-1" aria-hidden="true" />
                <p className="text-xs text-muted-foreground m-0">{t("templateEditor.noFieldsMatched")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
