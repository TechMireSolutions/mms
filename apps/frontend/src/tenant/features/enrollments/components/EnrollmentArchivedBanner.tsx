import type { Enrollment } from '@mms/shared';
import { EntityArchivedBanner } from '@/components/ui/DetailDrawerArchiveChrome';
import { useTranslation } from '@/hooks/useTranslation';

/** Soft-delete archive banner for enrollment drawer. */
export function EnrollmentArchivedBanner({
  enrollment,
}: {
  enrollment: Enrollment;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <EntityArchivedBanner
      deletedAt={enrollment.deletedAt}
      deletionReason={enrollment.deletionReason}
      titleWithDate={(date) => t('enrollments.detail.archivedBanner', { date })}
      reasonLabel={t('enrollments.deletionReasonLabel')}
    />
  );
}
