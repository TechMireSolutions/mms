import type { Faculty } from "@mms/shared";
import type { EntityDescriptor } from "@/types/entityRegistry";
import { teachersEntityDescriptor } from "@/components/common/entityRegistry";
import { useStaticEntityDescriptor } from "@/components/common/useStaticEntityDescriptor";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Returns an i18n-resolved EntityDescriptor<Faculty> for teachers entity
 * alias with all labels resolved through the active locale at call time.
 */
export function useTeachersEntityDescriptor(): EntityDescriptor<Faculty> {
  const { t } = useTranslation();
  return useStaticEntityDescriptor(
    teachersEntityDescriptor,
    (key, fallback) => t(key as Parameters<typeof t>[0]) || fallback,
  );
}

export const useTeacherEntityDescriptor = useTeachersEntityDescriptor;
