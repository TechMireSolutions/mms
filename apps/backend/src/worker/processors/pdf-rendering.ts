import { compileTypstToPdf, type TypstTemplateType } from './typst-compiler.js';
import { uploadBufferToStorage, resolveTenantExportKey, type StorageUploadResult } from '../../config/storage.js';

export interface PdfRenderJobPayload {
  template: TypstTemplateType;
  data: Record<string, unknown>;
  filename: string;
  lang?: 'ar' | 'ur' | 'fa' | 'en';
  direction?: 'rtl' | 'ltr';
}

export async function processPdfRenderJob(
  tenantId: string,
  payload: PdfRenderJobPayload,
  onProgress?: (percent: number) => Promise<void> | void
): Promise<StorageUploadResult> {
  if (onProgress) await onProgress(20);

  const pdfBuffer = await compileTypstToPdf({
    template: payload.template,
    data: payload.data,
    lang: payload.lang,
    direction: payload.direction,
  });

  if (onProgress) await onProgress(70);

  const key = resolveTenantExportKey(
    tenantId,
    payload.filename.endsWith('.pdf') ? payload.filename : `${payload.filename}.pdf`
  );

  const result = await uploadBufferToStorage(tenantId, key, pdfBuffer, 'application/pdf');

  if (onProgress) await onProgress(100);

  return result;
}
