/** Normalise GET /api/contacts list payloads ({ contacts } or legacy bare array). */
export function contactsFromListBody(body: unknown): Array<{ id: string | number; deletedAt?: string; deletionReason?: string }> {
  if (Array.isArray(body)) {
    return body as Array<{ id: string | number; deletedAt?: string; deletionReason?: string }>;
  }
  if (body && typeof body === 'object' && 'contacts' in body) {
    const contacts = (body as { contacts: unknown }).contacts;
    if (Array.isArray(contacts)) {
      return contacts as Array<{ id: string | number; deletedAt?: string; deletionReason?: string }>;
    }
  }
  return [];
}
