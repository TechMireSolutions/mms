import React from "react";
import { Smartphone } from "lucide-react";
import { type Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppleContactsPanel } from "@/tenant/features/contacts/hooks/useAppleContactsPanel";
import {
  AppleContactsDropzone,
  AppleContactsExportBar,
  AppleContactsExportGuide,
  AppleContactsFileInput,
  AppleContactsImportResult,
  AppleContactsPreviewList,
} from "@/tenant/features/contacts/components/sync/AppleContactsPanelSections";

export interface AppleContactsPanelProps {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * AppleContactsPanel component to import and export vCard files.
 */
export function AppleContactsPanel({
  contacts,
  onImport,
  canWrite = true,
}: AppleContactsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const apple = useAppleContactsPanel({ contacts, onImport, canWrite });

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
          <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <span className="text-sm font-bold text-foreground">{t("contacts.sync.appleTitle")}</span>
        <span className="text-[10px] text-muted-foreground">{t("contacts.sync.vcardLabel")}</span>
      </div>
      <div className="p-4 space-y-4 text-start">
        <AppleContactsExportGuide t={t} />

        {canWrite && (
          <AppleContactsFileInput
            fileRef={apple.fileRef}
            onChange={apple.handleFile}
            t={t}
          />
        )}

        {canWrite && apple.previewList.length === 0 && !apple.result && (
          <AppleContactsDropzone
            isDragging={apple.isDragging}
            canWrite={canWrite}
            onOpenPicker={apple.openFilePicker}
            onDragOver={apple.handleDragOver}
            onDragLeave={apple.handleDragLeave}
            onDrop={apple.handleDrop}
            t={t}
          />
        )}

        {canWrite && apple.previewList.length > 0 && (
          <AppleContactsPreviewList
            previewList={apple.previewList}
            importing={apple.importing}
            onClear={apple.clearPreview}
            onImport={() => void apple.handleImport()}
            onChooseDifferent={apple.chooseDifferentFile}
            t={t}
          />
        )}

        {apple.result && <AppleContactsImportResult result={apple.result} t={t} />}

        <AppleContactsExportBar
          contactCount={contacts.length}
          onExport={apple.handleExport}
          t={t}
        />
      </div>
    </section>
  );
}
