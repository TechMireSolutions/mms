import {
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { type Contact, parseVCard } from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { resolvePhoneLabel, resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";
import { downloadBackgroundJobArtifact } from "@/lib/backgroundJobs/backgroundJobApi";
import { startServerContactsVcfExport } from "@/lib/backgroundJobs/startServerContactsBackgroundJobs";
import { useContactsMetrics } from "@/tenant/features/contacts/hooks/useContacts";
import { useContactMutations } from "@/tenant/features/contacts/hooks/useContactMutations";
import {
  buildAppleImportIdentityCandidates,
  filterAppleImportFreshContacts,
} from "@/tenant/features/contacts/hooks/appleContactsIdentity";

export function useAppleContactsPanel({
  onImport,
  canWrite,
}: {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const { phoneLabels, emailLabels, defaultPhoneCountryCode } = useContactConfig();
  const { matchContactIdentity } = useContactMutations();
  const mobileLabel = resolvePhoneLabel(undefined, phoneLabels, t);
  const personalLabel = resolveEmailLabel(undefined, emailLabels, t);
  const { data: metrics } = useContactsMetrics({ enabled: true });
  const exportCount = metrics?.total ?? 0;
  const [previewList, setPreviewList] = useState<Contact[]>([]);
  const importing = matchContactIdentity.isPending;
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = ((file: File): void => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        if (readerEvent.target && typeof readerEvent.target.result === "string") {
          setPreviewList(
            parseVCard(readerEvent.target.result, {
              mobileLabel,
              personalLabel,
              defaultPhoneCountryCode,
            }),
          );
          setResult(null);
        }
      };
      reader.readAsText(file);
    });

  const handleFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    processFile(file);
  };

  const handleDroppedFiles = (files: FileList | null): void => {
    if (!canWrite) return;
    const file = files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async (): Promise<void> => {
    if (!canWrite) return;
    try {
      const candidates = buildAppleImportIdentityCandidates(previewList, defaultPhoneCountryCode);
      const existing = await matchContactIdentity.mutateAsync(candidates);
      const fresh = filterAppleImportFreshContacts(previewList, existing);
      await onImport(fresh);
      setResult({ imported: fresh.length, skipped: previewList.length - fresh.length });
      setPreviewList([]);
    } catch {
      notify.error(t("contacts.saveFailed"));
    }
  };

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    try {
      const filename = t("contacts.sync.vcfFileName");
      const job = await startServerContactsVcfExport({
        filename,
        label: t("contacts.jobs.exportLabelServer"),
      });
      if (job.hasDownload && job.status === "completed") {
        await downloadBackgroundJobArtifact(job.id, filename);
      }
      notify.success(t("contacts.exportSuccess"));
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      notify.error(t("contacts.saveFailed"));
    } finally {
      setExporting(false);
    }
  };

  const clearPreview = (): void => setPreviewList([]);

  const chooseDifferentFile = (): void => {
    setPreviewList([]);
    fileRef.current?.click();
  };

  const openFilePicker = (): void => {
    if (canWrite) fileRef.current?.click();
  };

  return {
    previewList,
    importing,
    exporting,
    exportCount,
    result,
    isDragging,
    setIsDragging,
    fileRef: fileRef as RefObject<HTMLInputElement | null>,
    handleFile,
    handleDroppedFiles,
    handleImport,
    handleExport,
    clearPreview,
    chooseDifferentFile,
    openFilePicker,
  };
}
