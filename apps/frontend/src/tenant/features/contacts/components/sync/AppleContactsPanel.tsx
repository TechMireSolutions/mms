import React, { useState, useRef, useCallback } from "react";
import {
  Upload, Download, CheckCircle2, FileText,
  RefreshCw, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { resolvePhoneLabel, resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { getDisplayName, getPrimaryPhone, getPrimaryEmail } from "@mms/shared";
import { Contact, parseVCard, toVCard } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { triggerFileDownload } from "@/lib/download";
import { notify } from "@/lib/notify";

export interface AppleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * AppleContactsPanel component to import and export vCard files.
 */
export function AppleContactsPanel({ contacts, onImport, canWrite = true }: AppleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { phoneLabels, emailLabels, defaultPhoneCountryCode } = useContactConfig();
  const mobileLabel = resolvePhoneLabel(undefined, phoneLabels, t);
  const personalLabel = resolveEmailLabel(undefined, emailLabels, t);
  const [previewList, setPreviewList] = useState<Contact[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File): void => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (readerEvent.target && typeof readerEvent.target.result === "string") {
          setPreviewList(parseVCard(readerEvent.target.result, { mobileLabel, personalLabel, defaultPhoneCountryCode }));
          setResult(null);
        }
      };
      reader.readAsText(file);
    },
    [mobileLabel, personalLabel, defaultPhoneCountryCode],
  );

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    processFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (canWrite) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!canWrite) return;
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImport = async (): Promise<void> => {
    if (!canWrite) return;
    setImporting(true);
    try {
      const existingNames = new Set(contacts.map((contact) => getDisplayName(contact).toLowerCase().trim()));
      const fresh = previewList.filter((contact) => !existingNames.has(getDisplayName(contact).toLowerCase().trim()));
      await onImport(fresh);
      setResult({ imported: fresh.length, skipped: previewList.length - fresh.length });
      setPreviewList([]);
    } catch {
      notify.error(t("contacts.saveFailed"));
    } finally {
      setImporting(false);
    }
  };

  const handleExport = (): void => {
    const vcf = contacts.map(toVCard).join("\r\n");
    const blob = new Blob([vcf], { type: "text/vcard" });
    triggerFileDownload(blob, "madrasa-contacts.vcf");
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
          <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">{t('contacts.sync.appleTitle')}</span>
        <span className="text-[10px] text-muted-foreground">{t('contacts.sync.vcardLabel')}</span>
      </div>
      <div className="p-4 space-y-4 text-start">
        
        <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">{t('contacts.sync.appleExportTitle')}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>{t('contacts.sync.appleExportStep1')}</li>
            <li>{t('contacts.sync.appleExportStep2')}</li>
            <li>{t('contacts.sync.appleExportStep3')}</li>
            <li>{t('contacts.sync.appleExportStep4')}</li>
          </ol>
        </div>

        
        {canWrite && <input
          id="contacts-vcf-import-file-input"
          name="contactsVcfFile"
          ref={fileRef}
          type="file"
          accept=".vcf,text/vcard"
          className="hidden"
          onChange={handleFile}
          aria-label={t('contacts.sync.uploadVcf')}
        />}
        {canWrite && previewList.length === 0 && !result && (
          <Button
            type="button"
            variant="outline"
            onClick={() => canWrite && fileRef.current?.click()}
            disabled={!canWrite}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full flex flex-col items-center justify-center gap-2 py-7 border-2 border-dashed rounded-xl text-muted-foreground transition-all cursor-pointer bg-card disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-card h-auto shadow-none ${
              isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-primary/5"
            }`}
          >
            <FileText className="w-7 h-7 opacity-40" />
            <span className="text-sm font-semibold text-foreground">{t('contacts.sync.uploadVcf')}</span>
            <span className="text-xs">{t('contacts.sync.dragDropBrowse')}</span>
          </Button>
        )}

        {canWrite && previewList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {previewList.length} {t('contacts.sync.contactsFound')}
              </p>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreviewList([])}
                className="text-xs min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-transparent shadow-none"
              >
                {t('contacts.sync.clear')}
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-xl p-2 bg-card">
              {previewList.slice(0, 50).map((contact, contactIndex) => (
                <div key={contactIndex} className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/50 text-sm">
                  <span className="font-medium text-foreground truncate">{getDisplayName(contact)}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ms-2">
                    {getPrimaryPhone(contact) || getPrimaryEmail(contact) || ""}
                  </span>
                </div>
              ))}
              {previewList.length > 50 && (
                <p className="text-xs text-center text-muted-foreground py-1">
                  {t('contacts.sync.andMore', { count: previewList.length - 50 })}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-5 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-none"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>
                  {t('contacts.sync.importCount', { count: previewList.length })}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewList([]);
                  fileRef.current?.click();
                }}
                className="px-4 min-h-[44px] rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card shadow-none"
              >
                {t('contacts.sync.chooseDifferentFile')}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/30 text-sm text-success">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-success" />
            <div>
              <p className="font-semibold">{t('contacts.sync.importComplete')}</p>
              <p className="text-xs text-success/90 mt-0.5">
                {t('contacts.sync.importedCount', { count: result.imported })}
                {result.skipped > 0 ? ` · ${t('contacts.sync.skippedCount', { count: result.skipped })}` : ""}
              </p>
            </div>
          </div>
        )}

        
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('contacts.sync.exportAppleHint')}</span>
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={contacts.length === 0}
            className="flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors bg-card shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {t('contacts.sync.exportVcf', { count: contacts.length })}
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
