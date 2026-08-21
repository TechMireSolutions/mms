import { useMemo } from "react";
import { hasWhatsApp, type Teacher } from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useSessions } from "@/tenant/hooks/collections/sessions";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { listTeacherDetailAttributeFields } from "@/tenant/features/teachers/components/teacherDetailFields";
import type { TeacherAssignedClassItem } from "@/tenant/features/teachers/components/TeacherDetailSessionsSection";

/** Teacher detail drawer model — mirrors useStudentDetailModel (Students parity). */
export function useTeacherDetailModel(teacher: Teacher) {
  const { settings } = useTeacherConfig();
  const statusConfig = useTeacherStatusConfig();
  const { data: linkedContact } = useContactById(
    teacher.contactId != null ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );
  const sessionsQuery = useSessions();
  const sessions = sessionsQuery.data ?? [];

  const assignedClasses: TeacherAssignedClassItem[] = useMemo(() => {
    const list: TeacherAssignedClassItem[] = [];
    const teacherIdStr = String(teacher.id);
    for (const session of sessions) {
      if (!session.classes || session.classes.length === 0) continue;
      for (const cls of session.classes) {
        if (String(cls.teacherId) === teacherIdStr) {
          list.push({
            sessionId: session.id,
            sessionName: session.name,
            sessionType: session.type,
            sessionStatus: session.status,
            classId: cls.id,
            className: cls.name,
            room: cls.room,
            capacity: cls.capacity,
            enrolled: cls.enrolled,
            gender: cls.gender,
            ageMin: cls.ageMin,
            ageMax: cls.ageMax,
          });
        }
      }
    }
    return list;
  }, [sessions, teacher.id]);

  const detailFields = useMemo(
    () => listTeacherDetailAttributeFields(settings),
    [settings],
  );

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
