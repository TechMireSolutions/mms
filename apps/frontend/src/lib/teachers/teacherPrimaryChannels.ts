import {
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
  type Teacher,
} from "@mms/shared";

export type TeacherPrimaryChannels = {
  phone: string | null;
  email: string | null;
};

/**
 * Phone/email for Teachers detail + directory messaging.
 * Prefers linked-contact primaries when provided; falls back to hydrated teacher scalars.
 */
export function resolveTeacherPrimaryChannels(
  teacher: Pick<Teacher, "phone" | "email">,
  linkedContact?: Partial<Contact> | null,
): TeacherPrimaryChannels {
  const phone =
    (linkedContact ? getPrimaryPhone(linkedContact) : null)
    || teacher.phone?.trim()
    || null;
  const email =
    (linkedContact ? getPrimaryEmail(linkedContact) : null)
    || teacher.email?.trim()
    || null;
  return { phone, email };
}
