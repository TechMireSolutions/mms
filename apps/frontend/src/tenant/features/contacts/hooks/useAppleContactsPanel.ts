import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import {
  Contact,
  getDisplayName,
  getEmails,
  getPhoneNumbers,
  parseVCard,
  toVCard,
} from "@mms/shared";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { resolvePhoneLabel, resolveEmailLabel } from "@/lib/contacts/contactI18n";
import { triggerFileDownload } from "@/lib/download";
import { notify } from "@/lib/notify";
import { useTranslation } from "@/hooks/useTranslation";

export function useAppleContactsPanel({
  contacts,
  onImport,
  canWrite,
}: {
  contacts: Contact[];
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const { phoneLabels, emailLabels, defaultPhoneCountryCode } = useContactConfig();
  const mobileLabel = resolvePhoneLabel(undefined, phoneLabels, t);
  const personalLabel = resolveEmailLabel(undefined, emailLabels, t);
  const [previewList, setPreviewList] = useState<Contact[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File): void => {
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
    },
    [mobileLabel, personalLabel, defaultPhoneCountryCode],
  );

  const handleFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    processFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (canWrite) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (!canWrite) return;
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async (): Promise<void> => {
    if (!canWrite) return;
    setImporting(true);
    try {
      const existingPhones = new Set(contacts.flatMap((contact) => getPhoneNumbers(contact)));
      const existingEmails = new Set(contacts.flatMap((contact) => getEmails(contact)));
      const existingNames = new Set(
        contacts.map((contact) => getDisplayName(contact).toLowerCase().trim()).filter(Boolean),
      );
      const fresh = previewList.filter((contact) => {
        const phones = getPhoneNumbers(contact);
        const emails = getEmails(contact);
        if (phones.some((phone) => existingPhones.has(phone))) return false;
        if (emails.some((email) => existingEmails.has(email))) return false;
        // Name-only skip when the import row has no phone/email identifiers.
        if (phones.length === 0 && emails.length === 0) {
          const name = getDisplayName(contact).toLowerCase().trim();
          return !name || !existingNames.has(name);
        }
        return true;
      });
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
    result,
    isDragging,
    fileRef: fileRef as RefObject<HTMLInputElement | null>,
    handleFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImport,
    handleExport,
    clearPreview,
    chooseDifferentFile,
    openFilePicker,
  };
}
