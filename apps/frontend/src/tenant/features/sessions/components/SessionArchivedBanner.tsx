import type { Session } from '@mms/shared';
import { EntityArchivedBanner } from '@/components/ui/DetailDrawerArchiveChrome';
import { useTranslation } from '@/hooks/useTranslation';

/** Soft-delete archive banner for session drawer. */
export function SessionArchivedBanner({
  session,
}: {
  session: Session;
}): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <EntityArchivedBanner
      deletedAt={session.deletedAt}
      deletionReason={session.deletionReason}
      titleWithDate={(date) => t('sessions.detail.archivedBanner', { date })}
      reasonLabel={t('sessions.deletionReasonLabel')}
    />
  );
}
