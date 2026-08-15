import { useMemo } from "react";
import { hasWhatsApp, type Teacher } from "@mms/shared";
import { useTeacherConfig } from "@/hooks/useStandardModuleConfig";
import { resolveTeacherPrimaryChannels } from "@/lib/teachers/teacherPrimaryChannels";
import { useContactById } from "@/tenant/hooks/collections/contacts";
import { useTeacherStatusConfig } from "@/tenant/features/teachers/hooks/useTeacherStatusConfig";
import { listTeacherDetailAttributeFields } from "@/tenant/features/teachers/components/teacherDetailFields";

/** Teacher detail drawer model — mirrors useStudentDetailModel (Students parity). */
export function useTeacherDetailModel(teacher: Teacher) {
  const { settings } = useTeacherConfig();
  const statusConfig = useTeacherStatusConfig();
  const { data: linkedContact } = useContactById(
    teacher.contactId != null ? String(teacher.contactId) : undefined,
    Boolean(teacher.contactId),
  );

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
  };
}
