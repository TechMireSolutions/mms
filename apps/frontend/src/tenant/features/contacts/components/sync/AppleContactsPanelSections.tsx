import {
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { ChangeEvent, DragEvent, RefObject } from "react";

export { AppleContactsPreviewList } from "@/tenant/features/contacts/components/sync/AppleContactsPreviewList";

export function AppleContactsExportGuide({ t }: { t: TranslationFunction }) {
  return (
    <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
      <p className="font-semibold text-foreground">{t("contacts.sync.appleExportTitle")}</p>
      <ol className="list-decimal list-inside space-y-0.5">
        <li>{t("contacts.sync.appleExportStep1")}</li>
        <li>{t("contacts.sync.appleExportStep2")}</li>
        <li>{t("contacts.sync.appleExportStep3")}</li>
        <li>{t("contacts.sync.appleExportStep4")}</li>
      </ol>
    </div>
  );
}

export function AppleContactsDropzone({
  isDragging,
  canWrite,
  onOpenPicker,
  onDragOver,
  onDragLeave,
  onDrop,
  t,
}: {
  isDragging: boolean;
  canWrite: boolean;
  onOpenPicker: () => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
  t: TranslationFunction;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onOpenPicker}
      disabled={!canWrite}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-full flex flex-col items-center justify-center gap-2 py-7 border-2 border-dashed rounded-xl text-muted-foreground transition-all cursor-pointer bg-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card h-auto shadow-none ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/40 hover:bg-primary/5"
      }`}
    >
      <FileText className="w-7 h-7 opacity-40" />
      <span className="text-sm font-semibold text-foreground">{t("contacts.sync.uploadVcf")}</span>
      <span className="text-xs">{t("contacts.sync.dragDropBrowse")}</span>
    </Button>
  );
}

export function AppleContactsImportResult({
  result,
  t,
}: {
  result: { imported: number; skipped: number };
  t: TranslationFunction;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-success" />
      <div>
        <p className="font-semibold">{t("contacts.sync.importComplete")}</p>
        <p className="text-xs text-success/90 mt-0.5">
          {t("contacts.sync.importedCount", { count: result.imported })}
          {result.skipped > 0 ? ` · ${t("contacts.sync.skippedCount", { count: result.skipped })}` : ""}
        </p>
      </div>
    </div>
  );
}

export function AppleContactsExportBar({
  contactCount,
  onExport,
  t,
}: {
  contactCount: number;
  onExport: () => void;
  t: TranslationFunction;
}) {
  return (
    <div className="border-t border-border pt-3 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{t("contacts.sync.exportAppleHint")}</span>
      <Button
        type="button"
        variant="outline"
        onClick={onExport}
        disabled={contactCount === 0}
        className="flex items-center gap-1.5 px-3.5 min-h-11 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors bg-card shadow-none"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{t("contacts.sync.exportVcf", { count: contactCount })}</span>
      </Button>
    </div>
  );
}

export function AppleContactsFileInput({
  fileRef,
  onChange,
  t,
}: {
  fileRef: RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  t: TranslationFunction;
}) {
  return (
    <input
      id="contacts-vcf-import-file-input"
      name="contactsVcfFile"
      ref={fileRef}
      type="file"
      accept=".vcf,text/vcard"
      className="hidden"
      onChange={onChange}
      aria-label={t("contacts.sync.uploadVcf")}
    />
  );
}
