import type { Student } from "@mms/shared";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { studentsEntityDescriptor } from "@/components/common/entityRegistry";
import { useStaticEntityDescriptor } from "@/components/common/useStaticEntityDescriptor";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Returns an i18n-resolved EntityDescriptor<Student> with all labels
 * resolved through the active locale at call time.
 *
 * Canonical pattern: hook call site resolves labels; static descriptor
 * carries labelKey as SSOT field-key references.
 */
export function useStudentEntityDescriptor(): EntityDescriptor<Student> {
  const { t } = useTranslation();
  return useStaticEntityDescriptor(
    studentsEntityDescriptor,
    (key, fallback) => t(key as Parameters<typeof t>[0]) || fallback,
  );
}
