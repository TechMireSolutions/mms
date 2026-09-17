import { hasWhatsApp, type Teacher } from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveTeacherPrimaryChannels } from "@/lib/faculty/facultyPrimaryChannels";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useSessions, useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useTeacherStatusConfig } from "@/tenant/features/faculty/hooks/useFacultyStatusConfig";
import { listTeacherDetailAttributeFields } from "@/tenant/features/faculty/components/facultyDetailFields";
import { getTeacherAssignedClasses, type TeacherAssignedClassItem } from "@/lib/faculty/facultyAssignment";

/** Teacher detail drawer model — mirrors useStudentDetailModel (Students parity). */
export function useTeacherDetailModel(teacher: Teacher) {
  const { settings } = useTeacherConfig();
  const statusConfig = useTeacherStatusConfig();
  const { data: linkedContact } = useContactById(
    teacher.contactId != null ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );
  const sessionsQuery = useSessions();
  const sessions = useSessionsCollection();

  const assignedClasses: TeacherAssignedClassItem[] = (() => {
    if (!teacher.id) return [];
    return getTeacherAssignedClasses(teacher.id, sessions);
  })();

  const detailFields = (() => listTeacherDetailAttributeFields(settings))();

  const { phone: primaryPhone, email: primaryEmail } = resolveTeacherPrimaryChannels(
    teacher,
    linkedContact,
  );

  // `status` renders in the hero badge and `notes` in its own section — neither
  // counts as a visible attribute row; contact-owned gender/channels render as
  // their own rows when present, so any of those also make the card render.
  const hasVisibleDetailFields =
    detailFields.some((field) => field.key !== "status" && field.key !== "notes") ||
    Boolean(teacher.gender) ||
    Boolean(primaryPhone) ||
    Boolean(primaryEmail);

  return {
    statusConfig,
    detailFields,
    linkedContact,
    primaryPhone,
    primaryEmail,
    // Gate on the number actually used for the WhatsApp recipient so gate ≡ recipient.
    hasWhatsAppContact: hasWhatsApp({ phone: primaryPhone ?? undefined }),
    hasVisibleDetailFields,
    assignedClasses,
    sessionsLoading: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.isError,
  };
}

export const useFacultyDetailModel = useTeacherDetailModel;

