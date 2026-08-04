import { getInitials } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useTranslation } from '@/hooks/useTranslation';
import type { ValidatedMessagingRecipient } from './useMessageComposerDispatch';

export type RecipientTab = 'all' | 'eligible' | 'skipped';

interface MessageComposerRecipientsProps {
  isEmail: boolean;
  isSms: boolean;
  recipientsCount: number;
  recipientTab: RecipientTab;
  search: string;
  displayedRecipients: ValidatedMessagingRecipient[];
  validatedRecipients: ValidatedMessagingRecipient[];
  eligibleRecipients: ValidatedMessagingRecipient[];
  skippedRecipients: ValidatedMessagingRecipient[];
  previewIndex: number;
  message: string;
  onRecipientTabChange: (tab: RecipientTab) => void;
  onSearchChange: (search: string) => void;
  onPreviewIndexChange: (index: number) => void;
  onSendOne: (recipient: ValidatedMessagingRecipient, message: string) => void;
}

export function MessageComposerRecipients({
  isEmail,
  isSms,
  recipientsCount,
  recipientTab,
  search,
  displayedRecipients,
  validatedRecipients,
  eligibleRecipients,
  skippedRecipients,
  previewIndex,
  message,
  onRecipientTabChange,
  onSearchChange,
  onPreviewIndexChange,
  onSendOne,
}: MessageComposerRecipientsProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('messaging.confirmRecipients')} ({displayedRecipients.length})</span>
          <SegmentedPillFilter
            options={[
              { value: 'all', label: `${t('messaging.filter.all')} (${validatedRecipients.length})` },
              { value: 'eligible', label: `${t('messaging.filter.eligible')} (${eligibleRecipients.length})` },
              ...(skippedRecipients.length ? [{ value: 'skipped', label: `${t('messaging.filter.skipped')} (${skippedRecipients.length})` }] : []),
            ]}
            value={recipientTab}
            onChange={(value) => onRecipientTabChange(value as RecipientTab)}
            size="sm"
          />
        </div>
        {recipientsCount > 3 && <SearchBar placeholder={t('messaging.search.placeholder')} value={search} onChange={onSearchChange} className="text-xs" />}
        <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-2">
          {displayedRecipients.map((recipient) => {
            const eligibleIndex = eligibleRecipients.findIndex((eligible) => eligible.id === recipient.id);
            const displayAddress = recipient.address || (isEmail ? recipient.email : recipient.phone) || (isEmail ? t('messaging.missingEmail') : t('messaging.missingPhone'));
            return (
              <li key={recipient.id} className={`flex min-w-0 items-center gap-2 rounded p-1.5 text-xs transition-colors ${!recipient.isValid ? 'border border-warning/20 bg-warning/10 text-warning' : previewIndex === eligibleIndex ? 'bg-primary/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/30'}`}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">{getInitials(recipient.name)}</span>
                <div className="min-w-0 flex-1">
                  <Button type="button" variant="ghost" className="h-auto min-h-11 w-full min-w-0 justify-start truncate px-2 text-xs" onClick={() => { if (eligibleIndex >= 0) onPreviewIndexChange(eligibleIndex); }}>{recipient.name}</Button>
                  <span className="block truncate px-2 font-mono text-xs text-muted-foreground">({displayAddress})</span>
                </div>
                {recipient.isValid ? <Button type="button" variant="link" className="ms-auto inline-flex min-h-11 shrink-0 items-center p-0 text-xs font-semibold text-primary" onClick={() => onSendOne(recipient, message)}>{isEmail ? t('messaging.sendEmail') : isSms ? t('messaging.openSmsApp') : t('messaging.openWhatsapp')}</Button> : <span className="ms-auto shrink-0 text-xs font-semibold text-warning">{t('messaging.skippedStatus')}</span>}
              </li>
            );
          })}
          {displayedRecipients.length === 0 && (
            <li className="list-none">
              <EmptyState title={t('messaging.noRecipientsFound')} compact icon={null} />
            </li>
          )}
        </ul>
      </div>
      {eligibleRecipients.length === 0 && <p className="text-xs font-medium text-destructive">{isEmail ? t('messaging.selectRecipientsDesc') : isSms ? t('messaging.smsNoEligibleContacts') : t('messaging.whatsappSkippedNote')}</p>}
    </>
  );
}
