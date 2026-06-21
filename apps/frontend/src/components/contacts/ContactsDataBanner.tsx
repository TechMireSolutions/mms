import React from 'react';
import { WifiOff, AlertCircle, CloudUpload, AlertTriangle } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import { useContacts } from '@/hooks/useContacts';
import { useContactsSyncOutbox } from '@/hooks/useContactsSyncOutbox';
import ConfirmAlertDialog from '@/components/ui/ConfirmAlertDialog';

interface ContactsDataBannerProps {
  onReviewConflicts?: () => void;
  /** When false, skip full-list fetch error surfacing (Work tab uses paginated API). */
  listFetchEnabled?: boolean;
}

/** Surfaces offline / sync failures for the Contacts module (globle1 §1.4). */
export default function ContactsDataBanner({
  onReviewConflicts,
  listFetchEnabled = true,
}: ContactsDataBannerProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const { isError, isFetching, failureCount } = useContacts({ enabled: listFetchEnabled });
  const { pendingCount, conflictCount, flushing, flush, clearConflicts } = useContactsSyncOutbox();
  const [offline, setOffline] = React.useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const [dismissAllOpen, setDismissAllOpen] = React.useState(false);

  React.useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  const banners: React.JSX.Element[] = [];

  if (offline) {
    banners.push(
      <div
        key="offline"
        className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
        role="status"
      >
        <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{t('contacts.sync.offline')}</span>
      </div>,
    );
  }

  if (pendingCount > 0 || flushing) {
    banners.push(
      <div
        key="pending"
        className="flex items-center justify-between gap-3 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info"
        role="status"
      >
        <div className="flex items-center gap-2 min-w-0">
          <CloudUpload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>
            {flushing
              ? t('contacts.sync.syncingPending')
              : t('contacts.sync.pending', { count: pendingCount })}
          </span>
        </div>
        {!flushing && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => void flush()}
            className="shrink-0 text-xs font-semibold underline hover:no-underline"
          >
            {t('contacts.sync.retryNow')}
          </button>
        )}
      </div>,
    );
  }

  if (conflictCount > 0) {
    banners.push(
      <div
        key="conflicts"
        className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
        role="alert"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>{t('contacts.sync.conflicts', { count: conflictCount })}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReviewConflicts}
            className="text-xs font-semibold underline hover:no-underline"
          >
            {t('contacts.sync.reviewConflicts')}
          </button>
          <button
            type="button"
            onClick={() => setDismissAllOpen(true)}
            className="text-xs font-semibold underline hover:no-underline opacity-80"
          >
            {t('contacts.sync.dismissConflicts')}
          </button>
        </div>
      </div>,
    );
  }

  if (isError && !isFetching) {
    banners.push(
      <div
        key="fetch-error"
        className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        role="alert"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>{t('contacts.sync.failed', { count: failureCount })}</span>
      </div>,
    );
  }

  if (banners.length === 0) return null;

  return (
    <>
      <div className="space-y-2">{banners}</div>
      <ConfirmAlertDialog
        open={dismissAllOpen}
        onOpenChange={setDismissAllOpen}
        title={t('contacts.sync.dismissConflictsConfirmTitle')}
        description={t('contacts.sync.dismissConflictsConfirmDesc', { count: conflictCount })}
        confirmLabel={t('contacts.sync.dismissConflicts')}
        onConfirm={() => {
          clearConflicts();
          setDismissAllOpen(false);
        }}
        destructive
      />
    </>
  );
}
