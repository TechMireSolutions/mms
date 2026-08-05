import {
  getPrimaryAddress,
  hasWhatsApp,
  isRelationshipContactColumnKey,
  isRelationshipTypeColumnKey,
  type Contact,
} from "@mms/shared";

/** Whether a card metadata column has renderable data for the contact. */
export function hasContactCardColumnData(contact: Contact, colId: string): boolean {
  switch (colId) {
    case "dob":
    case "solarDob":
    case "lunarDob":
      return Boolean(contact.dob);
    case "whatsapp":
      return hasWhatsApp(contact);
    case "gender":
      return Boolean(contact.gender);
    case "isSyed":
      return contact.isSyed !== undefined && contact.isSyed !== null;
    case "socials_platform":
      return Boolean(contact.socials && contact.socials.some((s) => s.platform && s.platform.trim().length > 0));
    case "socials_url":
      return Boolean(contact.socials && contact.socials.some((s) => s.url && s.url.trim().length > 0));
    case "line1":
    case "city":
    case "state":
    case "country": {
      const scalar = contact[colId as keyof Contact];
      if (scalar !== undefined && scalar !== null && String(scalar).trim().length > 0) return true;
      const addr = getPrimaryAddress(contact);
      if (!addr) return false;
      const addrVal = addr[colId as keyof typeof addr];
      return addrVal !== undefined && addrVal !== null && String(addrVal).trim().length > 0;
    }
    default: {
      if (isRelationshipContactColumnKey(colId)) {
        return Boolean(
          contact.relationshipContacts &&
            contact.relationshipContacts.some(
              (link) => (link.name && link.name.trim().length > 0) || link.contactId,
            ),
        );
      }
      if (isRelationshipTypeColumnKey(colId)) {
        return Boolean(
          contact.relationshipContacts &&
            contact.relationshipContacts.some(
              (link) => link.relationship && link.relationship.trim().length > 0,
            ),
        );
      }
      const val = contact[colId as keyof Contact];
      if (typeof val === "boolean") return true;
      if (typeof val === "number") return true;
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && String(val).trim().length > 0;
    }
  }
}
