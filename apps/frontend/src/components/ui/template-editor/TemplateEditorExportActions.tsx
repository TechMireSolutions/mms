/**
 * @file TemplateEditorExportActions.tsx
 * @description Toolbar action buttons for JSON import/export, Typst generation, and Zoho sync.
 */

import React, { useRef } from "react";
import { Download, Upload, FileCode2, CloudUpload, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorExportActionsProps {
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onExportTypst?: () => void;
  onExportZoho?: () => void;
  onPrint?: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  t: TranslationFunction;
}

const MAX_TEMPLATE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function TemplateEditorExportActions({
  onExportJson,
  onImportJson,
  onExportTypst,
  onExportZoho,
  onPrint,
  isExporting = false,
  disabled = false,
  t,
}: TemplateEditorExportActionsProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isExporting;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size <= MAX_TEMPLATE_FILE_SIZE && onImportJson) {
        onImportJson(file);
      }
      e.target.value = "";
    }
  };

  return (
    <div
      role="group"
      aria-label={t("common.export")}
      className="flex items-center gap-1.5 ms-2 flex-nowrap shrink-0 print:hidden"
    >
      <Button
        type="button"
        onClick={onPrint || (() => window.print())}
        disabled={isDisabled}
        variant="outline"
        className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
        title={t("templateEditor.print")}
        aria-label={t("templateEditor.print")}
      >
        <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
        <span className="hidden sm:inline">{t("templateEditor.print")}</span>
      </Button>

      {onExportJson && (
        <Button
          type="button"
          onClick={onExportJson}
          disabled={isDisabled}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportJson")}
          aria-label={t("templateEditor.exportJson")}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="hidden sm:inline">JSON</span>
        </Button>
      )}

      {onImportJson && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            aria-label={t("templateEditor.importJson")}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            variant="outline"
            className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
            title={t("templateEditor.importJson")}
            aria-label={t("templateEditor.importJson")}
          >
            <Upload className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span className="hidden sm:inline">{t("templateEditor.import")}</span>
          </Button>
        </>
      )}

      {onExportTypst && (
        <Button
          type="button"
          onClick={onExportTypst}
          disabled={isDisabled}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportTypst")}
          aria-label={t("templateEditor.exportTypst")}
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          <span className="hidden sm:inline">Typst</span>
        </Button>
      )}

      {onExportZoho && (
        <Button
          type="button"
          onClick={onExportZoho}
          disabled={isDisabled}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportZoho")}
          aria-label={t("templateEditor.exportZoho")}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" aria-hidden="true" />
          ) : (
            <CloudUpload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Zoho</span>
        </Button>
      )}
    </div>
  );
}
