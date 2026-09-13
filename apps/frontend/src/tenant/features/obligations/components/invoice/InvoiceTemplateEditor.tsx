/**
 * @file InvoiceTemplateEditor.tsx
 * @description Obligations invoice template editor adapter wrapping the shared SSOT TemplateEditor.
 */

import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { TemplateEditor } from "@/components/ui/TemplateEditor";
import {
  AVAILABLE_FIELDS,
  getAvailablePresets,
  getDefaultTemplate,
  loadTemplate,
  saveTemplate,
  type InvoiceTemplate,
} from "@/lib/invoiceTemplateStore";
import type { DocumentTemplate, DocumentTemplatePreset } from "@mms/shared";
import { notify } from "@/lib/notify";

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
}

export function InvoiceTemplateEditor({
  onClose,
  fullscreen = true,
}: InvoiceTemplateEditorProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleSave = (tmpl: DocumentTemplate) => {
    saveTemplate(tmpl as unknown as InvoiceTemplate);
    notify.success(t("obligations.templateSaved"));
  };

  return (
    <TemplateEditor
      title={t("obligations.templateEditorTitle")}
      template={loadTemplate() as unknown as DocumentTemplate}
      defaultTemplate={getDefaultTemplate() as unknown as DocumentTemplate}
      availableFields={AVAILABLE_FIELDS}
      presets={getAvailablePresets() as unknown as DocumentTemplatePreset[]}
      documentType="invoice"
      fullscreen={fullscreen}
      onSave={handleSave}
      onClose={onClose}
    />
  );
}

export default InvoiceTemplateEditor;
