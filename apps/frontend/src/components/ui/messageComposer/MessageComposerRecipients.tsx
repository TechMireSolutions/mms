import { getInitials } from '@mms/shared';
import { Button } from '@/components/ui/button';
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('messaging.confirmRecipients')} ({displayedRecipients.length})</span>
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
        {recipientsCount > 3 && <SearchBar placeholder={t('messaging.search.placeholder')} value={search} onChange={onSearchChange} className="h-8 text-xs" />}
        <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-2">
          {displayedRecipients.map((recipient) => {
            const eligibleIndex = eligibleRecipients.findIndex((eligible) => eligible.id === recipient.id);
            const displayAddress = recipient.address || (isEmail ? recipient.email : recipient.phone) || (isEmail ? t('messaging.missingEmail') : t('messaging.missingPhone'));
            return (
              <li key={recipient.id} className={`flex items-center gap-2 rounded p-1.5 text-xs transition-colors ${!recipient.isValid ? 'border border-warning/20 bg-warning/10 text-warning' : previewIndex === eligibleIndex ? 'bg-primary/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted/30'}`}>
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[9px] font-extrabold text-primary">{getInitials(recipient.name)}</span>
                <Button type="button" variant="ghost" className="h-auto flex-1 justify-start truncate p-0 text-xs" onClick={() => { if (eligibleIndex >= 0) onPreviewIndexChange(eligibleIndex); }}>{recipient.name}</Button>
                <span className="font-mono text-[10px] text-muted-foreground">({displayAddress})</span>
                {recipient.isValid ? <Button type="button" variant="link" className="ms-auto h-auto flex-shrink-0 p-0 text-[11px] font-semibold text-primary" onClick={() => onSendOne(recipient, message)}>{isEmail ? t('messaging.sendEmail') : isSms ? t('contacts.openSmsApp') : t('contacts.whatsapp.open')}</Button> : <span className="ms-auto text-[10px] font-semibold text-warning">{t('messaging.skippedStatus')}</span>}
              </li>
            );
          })}
          {displayedRecipients.length === 0 && <li className="py-2 text-center text-xs text-muted-foreground">{t('messaging.noRecipientsFound')}</li>}
        </ul>
      </div>
      {eligibleRecipients.length === 0 && <p className="text-xs font-medium text-destructive">{isEmail ? t('messaging.selectRecipientsDesc') : isSms ? t('contacts.smsNoEligibleContacts') : t('contacts.whatsapp.skippedNote')}</p>}
    </>
  );
}
