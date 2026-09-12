/**
 * @file InvoiceTemplateEditor.tsx
 * @description Obligations invoice template editor adapter wrapping the shared SSOT TemplateEditor.
 */

import React from "react";
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

export interface InvoiceTemplateEditorProps {
  onClose: () => void;
  fullscreen?: boolean;
}

export function InvoiceTemplateEditor({
  onClose,
  fullscreen = true,
}: InvoiceTemplateEditorProps): React.JSX.Element {
  return (
    <TemplateEditor
      template={loadTemplate() as unknown as DocumentTemplate}
      defaultTemplate={getDefaultTemplate() as unknown as DocumentTemplate}
      availableFields={AVAILABLE_FIELDS}
      presets={getAvailablePresets() as unknown as DocumentTemplatePreset[]}
      documentType="invoice"
      fullscreen={fullscreen}
      onSave={(tmpl) => saveTemplate(tmpl as unknown as InvoiceTemplate)}
      onClose={onClose}
    />
  );
}

export default InvoiceTemplateEditor;
