import { toVCard, type Contact } from '@mms/shared';
import { loadContactsPage } from './contactServiceLoad.js';

const VCF_PAGE_SIZE = 500;

export interface ContactsVcfExportResult {
  vcf: string;
  filename: string;
  count: number;
}

/**
 * Builds a tenant VCF export by SQL-paginating contacts (no full-list hydrate).
 */
export async function buildContactsVcfExport(options?: {
  filename?: string;
  onProgress?: (processed: number, total: number) => void | Promise<void>;
}): Promise<ContactsVcfExportResult> {
  const filename = options?.filename?.trim() || 'contacts.vcf';
  const cards: string[] = [];
  let page = 1;

  for (;;) {
    const pageResult = await loadContactsPage({
      page,
      limit: VCF_PAGE_SIZE,
      includeDeleted: false,
    });
    for (const contact of pageResult.contacts as Contact[]) {
      cards.push(toVCard(contact));
    }
    await options?.onProgress?.(cards.length, pageResult.total);
    if (!pageResult.hasMore) break;
    page += 1;
  }

  return {
    vcf: cards.join('\r\n'),
    filename,
    count: cards.length,
  };
}
