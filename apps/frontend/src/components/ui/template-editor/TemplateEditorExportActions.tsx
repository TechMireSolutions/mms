/**
 * @file TemplateEditorExportActions.tsx
 * @description Toolbar action buttons for JSON import/export, Typst generation, and Zoho sync.
 */

import React, { useRef } from "react";
import { Download, Upload, FileCode2, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export interface TemplateEditorExportActionsProps {
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onExportTypst?: () => void;
  onExportZoho?: () => void;
  t: TranslationFunction;
}

export function TemplateEditorExportActions({
  onExportJson,
  onImportJson,
  onExportTypst,
  onExportZoho,
  t,
}: TemplateEditorExportActionsProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1.5 ms-2 flex-wrap">
      {onExportJson && (
        <Button
          type="button"
          onClick={onExportJson}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title="Export Template JSON"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>JSON</span>
        </Button>
      )}

      {onImportJson && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportJson(file);
                e.target.value = "";
              }
            }}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
            title="Import Template JSON"
          >
            <Upload className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
            <span>Import</span>
          </Button>
        </>
      )}

      {onExportTypst && (
        <Button
          type="button"
          onClick={onExportTypst}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportTypst")}
        >
          <FileCode2 className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
          <span>Typst</span>
        </Button>
      )}

      {onExportZoho && (
        <Button
          type="button"
          onClick={onExportZoho}
          variant="outline"
          className="min-h-11 px-2.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted transition-colors shadow-none flex items-center gap-1.5"
          title={t("templateEditor.exportZoho")}
        >
          <CloudUpload className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Zoho</span>
        </Button>
      )}
    </div>
  );
}
