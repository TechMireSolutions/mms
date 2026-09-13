/**
 * @file InvoiceTemplateEditor.tsx
 * @description Obligations invoice template editor adapter wrapping the shared SSOT TemplateEditor.
 */

import React, { useCallback, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useBranding } from "@/tenant/hooks/useBranding";
import { TemplateEditor } from "@/components/ui/TemplateEditor";
import {
  AVAILABLE_FIELDS,
  getAvailablePresets,
  getDefaultTemplate,
  indexLookups,
  loadTemplate,
  resolveField,
  saveTemplate,
  type InvoiceTemplate,
  type InvoiceReceiptPayload,
} from "@/lib/invoiceTemplateStore";
import {
  DEFAULT_CURRENCIES,
  formatBrandingAddress,
  type DocumentTemplatePreset,
  type Mujtahid,
  type MujtahidRep,
  type ObligationCollection,
  type ObligationType,
  type ZohoInvoicePayload,
} from "@mms/shared";
import { notify } from "@/lib/notify";
import {
  mapToTypstFeeReceipt,
  mapToZohoInvoice,
} from "@/components/ui/template-editor/templatePayloadMappers";
import {
  useMergedObligationContacts,
  useMergedObligationUsers,
} from "@/tenant/features/obligations/hooks/useObligationLookups";

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
  collection?: ObligationCollection | null;
  obligationTypes?: ObligationType[];
  reps?: MujtahidRep[];
  mujtahids?: Mujtahid[];
}

function triggerFileDownload(filename: string, content: string, mimeType = "application/json"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function InvoiceTemplateEditor({
  onClose,
  fullscreen = true,
  collection = null,
  obligationTypes = [],
  reps = [],
  mujtahids = [],
}: InvoiceTemplateEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const branding = useBranding();

  const contactIds = useMemo(() => {
    if (!collection) return [];
    const ids = [collection.sender_id, collection.reference_id].filter(
      (id): id is string => id != null && id !== ""
    );
    return Array.from(new Set(ids));
  }, [collection]);

  const liveContacts = useMergedObligationContacts(contactIds);

  const userIds = useMemo(() => {
    if (!collection?.received_by) return [];
    return [collection.received_by];
  }, [collection?.received_by]);

  const liveUsers = useMergedObligationUsers(userIds);

  const initialTemplate = useMemo<InvoiceTemplate>(
    () => loadTemplate(),
    []
  );
  const defaultTemplate = useMemo<InvoiceTemplate>(
    () => getDefaultTemplate(),
    []
  );

  const defaultSampleData = useMemo<InvoiceReceiptPayload>(() => {
    const institutionAddress =
      formatBrandingAddress(branding) || "123 Seminary Road, Karachi";
    const madrasaName = branding.madrasaName || "Madrasa Management System";

    return {
      institution: madrasaName,
      institution_name: madrasaName,
      institution_phone: branding.phone || "+92 21 34567890",
      institution_email: branding.email || "office@alhuda.edu",
      institution_address: institutionAddress,
      receipt_no: "REC-2026-0042",
      received_date: new Date().toISOString().slice(0, 10),
      sender: "Muhammad Ali Raza",
      sender_phone: "+92 300 1234567",
      sender_email: "ali.raza@example.com",
      reference: "Sayyid Kazim Hosseini",
      reference_phone: "+92 321 9876543",
      reference_email: "kazim.ref@example.com",
      obligation_type: "Khums (Sahm-e-Imam)",
      mujtahid: "Ayatullah al-Uzma Sistani",
      representative: "Maulana Baqir Zaidi",
      amount: "PKR 75,000.00",
      amount_in_words: "Seventy Five Thousand Rupees Only",
      currency: "PKR",
      payment_mode: "Bank Transfer",
      received_by: "Admin Office",
    };
  }, [branding]);

  const sampleData = useMemo<InvoiceReceiptPayload>(() => {
    if (!collection) return defaultSampleData;

    const indexedLookups = indexLookups({
      contacts: liveContacts,
      users: liveUsers,
      currencies: DEFAULT_CURRENCIES,
      obligationTypes,
      mujtahids,
      reps,
      branding,
    });

    const data: InvoiceReceiptPayload = { ...defaultSampleData };
    for (const item of AVAILABLE_FIELDS) {
      const val = resolveField(
        item.field,
        collection as unknown as Record<string, unknown>,
        indexedLookups
      );
      if (val !== undefined && val !== null && val !== "") {
        data[item.field] = val;
      }
    }
    return data;
  }, [collection, defaultSampleData, liveContacts, liveUsers, obligationTypes, mujtahids, reps, branding]);

  const presets = useMemo<DocumentTemplatePreset<InvoiceReceiptPayload>[]>(() => {
    return getAvailablePresets().map((p) => ({
      key: p.key,
      label: t(p.nameKey as Parameters<typeof t>[0]) || p.key,
      template: p.template,
    }));
  }, [t]);

  const handleSave = useCallback(
    (tmpl: InvoiceTemplate) => {
      try {
        saveTemplate(tmpl);
        notify.success(t("obligations.templateSaved"));
      } catch (err) {
        console.error("Failed to save invoice template:", err);
        notify.error(t("templateEditor.saveFailed"));
      }
    },
    [t]
  );

  const handleExportTypst = useCallback(
    (payload: Record<string, unknown>) => {
      try {
        const conforming = mapToTypstFeeReceipt(payload);
        const jsonStr = JSON.stringify(conforming, null, 2);
        triggerFileDownload(`typst-invoice-${conforming.receiptNo}.json`, jsonStr);
        notify.success(t("templateEditor.typstExported"));
      } catch (err) {
        console.error("Typst export failed:", err);
        notify.error(t("templateEditor.exportFailed"));
      }
    },
    [t]
  );

  const handleExportZoho = useCallback(
    (zohoPayload: ZohoInvoicePayload) => {
      try {
        const conforming = mapToZohoInvoice(
          zohoPayload as unknown as Record<string, unknown>
        );
        const jsonStr = JSON.stringify(conforming, null, 2);
        triggerFileDownload(`zoho-invoice-${conforming.invoice_number}.json`, jsonStr);
        notify.success(t("templateEditor.zohoExported"));
      } catch (err) {
        console.error("Zoho export failed:", err);
        notify.error(t("templateEditor.exportFailed"));
      }
    },
    [t]
  );

  return (
    <TemplateEditor<InvoiceReceiptPayload>
      title={t("obligations.templateEditorTitle")}
      template={initialTemplate}
      defaultTemplate={defaultTemplate}
      availableFields={AVAILABLE_FIELDS}
      presets={presets}
      documentType="invoice"
      sampleData={sampleData}
      fullscreen={fullscreen}
      onSave={handleSave}
      onClose={onClose}
      onExportTypst={handleExportTypst}
      onExportZoho={handleExportZoho}
    />
  );
}

export default InvoiceTemplateEditor;
