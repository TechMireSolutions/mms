import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import type { StandardMessagingRecipient } from '@mms/shared';
import { getInitials } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useTranslation } from '@/hooks/useTranslation';
import { MessageComposerRecipientPicker } from './MessageComposerRecipientPicker';
import type { ValidatedMessagingRecipient } from './useMessageComposerDispatch';

export type RecipientTab = 'all' | 'eligible' | 'skipped';

// Fix #6: named constant instead of magic number
const MIN_RECIPIENTS_FOR_SEARCH = 3;

// ─── Row sub-component ────────────────────────────────────────────────────────
// Fix #2: extracted so React.memo can skip re-renders for unchanged rows
interface RecipientRowProps {
  recipient: ValidatedMessagingRecipient;
  eligibleIndex: number;
  previewIndex: number;
  message: string;
  isEmail: boolean;
  isSms: boolean;
  disabled?: boolean;
  onPreviewIndexChange: (index: number) => void;
  onSendOne: (recipient: ValidatedMessagingRecipient, message: string) => void;
  onRemove: (id: string | number) => void;
  missingAddressLabel: string;
  removeLabel: string;
  sendLabel: string;
}

const RecipientRow = React.memo(function RecipientRow({
  recipient,
  eligibleIndex,
  previewIndex,
  message,
  isEmail,
  isSms,
  disabled,
  onPreviewIndexChange,
  onSendOne,
  onRemove,
  missingAddressLabel,
  removeLabel,
  sendLabel,
}: RecipientRowProps): React.JSX.Element {
  const displayAddress =
    recipient.address ||
    (isEmail ? recipient.email : recipient.phone) ||
    missingAddressLabel;

  const isPreviewActive = recipient.isValid && previewIndex === eligibleIndex;
  // Fix #8: preview button disabled when this recipient is skipped
  const previewDisabled = eligibleIndex < 0;

  return (
    <li
      className={`flex min-w-0 items-center gap-2 rounded p-1.5 text-xs transition-colors ${
        !recipient.isValid
          ? 'border border-warning/20 bg-warning/10 text-warning'
          : isPreviewActive
            ? 'bg-primary/10 font-semibold text-foreground'
            : 'text-muted-foreground hover:bg-muted/30'
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
        {getInitials(recipient.name)}
      </span>
      <div className="min-w-0 flex-1">
        {/* Fix #8: visually disabled when skipped — no silent no-op onClick */}
        <Button
          type="button"
          variant="ghost"
          disabled={previewDisabled}
          className="h-auto min-h-11 w-full min-w-0 justify-start truncate px-2 text-xs"
          onClick={() => onPreviewIndexChange(eligibleIndex)}
        >
          {recipient.name}
        </Button>
        <span className="block truncate px-2 font-mono text-xs text-muted-foreground">
          ({displayAddress})
        </span>
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-1">
        {recipient.isValid ? (
          <Button
            type="button"
            variant="link"
            className="inline-flex min-h-11 items-center p-0 text-xs font-semibold text-primary"
            onClick={() => onSendOne(recipient, message)}
          >
            {sendLabel}
          </Button>
        ) : (
          <span className="text-xs font-semibold text-warning">
            {/* skippedStatus shown inline — computed by parent via t() */}
            {sendLabel}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => onRemove(recipient.id)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          aria-label={removeLabel}
          title={removeLabel}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
interface MessageComposerRecipientsProps {
  isEmail: boolean;
  isSms: boolean;
  // Fix #4: recipientsCount removed — derived from validatedRecipients.length
  recipientTab: RecipientTab;
  search: string;
  displayedRecipients: ValidatedMessagingRecipient[];
  validatedRecipients: ValidatedMessagingRecipient[];
  eligibleRecipients: ValidatedMessagingRecipient[];
  skippedRecipients: ValidatedMessagingRecipient[];
  previewIndex: number;
  message: string;
  disabled?: boolean;
  onRecipientTabChange: (tab: RecipientTab) => void;
  onSearchChange: (search: string) => void;
  onPreviewIndexChange: (index: number) => void;
  onSendOne: (recipient: ValidatedMessagingRecipient, message: string) => void;
  onAdd: (recipient: StandardMessagingRecipient) => void;
  onRemove: (id: string | number) => void;
  isPickStep: boolean;
}

export function MessageComposerRecipients({
  isEmail,
  isSms,
  recipientTab,
  search,
  displayedRecipients,
  validatedRecipients,
  eligibleRecipients,
  skippedRecipients,
  previewIndex,
  message,
  disabled,
  onRecipientTabChange,
  onSearchChange,
  onPreviewIndexChange,
  onSendOne,
  onAdd,
  onRemove,
  isPickStep,
}: MessageComposerRecipientsProps): React.JSX.Element {
  const { t } = useTranslation();

  // Fix #1: memoised — stable Set reference when recipients haven't changed
  const existingIds = useMemo(
    () => new Set(validatedRecipients.map((r) => String(r.id))),
    [validatedRecipients],
  );

  // Fix #3: O(n) pre-computed index map — replaces O(n²) findIndex inside .map()
  const eligibleIndexMap = useMemo(
    () => new Map(eligibleRecipients.map((r, i) => [r.id, i])),
    [eligibleRecipients],
  );

  const missingAddressLabel = isEmail ? t('messaging.missingEmail') : t('messaging.missingPhone');
  const removeLabel = t('messaging.removeRecipient');

  // Fix #5: header always shows total count, not the current tab's filtered count
  const totalCount = validatedRecipients.length;

  const noEligibleMessage = isEmail
    ? t('messaging.selectRecipientsDesc')
    : isSms
      ? t('messaging.smsNoEligibleContacts')
      : t('messaging.whatsappSkippedNote');

  return (
    <>
      <div className="space-y-2">
        {!isPickStep && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-1">
            <SectionLabel weight="bold" tracking="wider" className="block">
              {t('messaging.confirmRecipients')} ({totalCount})
            </SectionLabel>
            <SegmentedPillFilter
              options={[
                { value: 'all', label: `${t('messaging.filter.all')} (${validatedRecipients.length})` },
                { value: 'eligible', label: `${t('messaging.filter.eligible')} (${eligibleRecipients.length})` },
                ...(skippedRecipients.length
                  ? [{ value: 'skipped', label: `${t('messaging.filter.skipped')} (${skippedRecipients.length})` }]
                  : []),
              ]}
              value={recipientTab}
              onChange={(value) => onRecipientTabChange(value as RecipientTab)}
              size="sm"
            />
          </div>
        )}

        <MessageComposerRecipientPicker
          kind={isEmail ? 'email' : 'phone'}
          existingIds={existingIds}
          disabled={disabled}
          onAdd={onAdd}
          onRemove={onRemove}
        />

        {!isPickStep && (
          <>
            {/* Fix #6: MIN_RECIPIENTS_FOR_SEARCH constant */}
            {totalCount > MIN_RECIPIENTS_FOR_SEARCH && (
              <SearchBar
                placeholder={t('messaging.search.placeholder')}
                value={search}
                onChange={onSearchChange}
                className="text-xs"
              />
            )}

            {/* Fix #7: list-none removed from <li> — it belongs on <ul> if anywhere */}
            <ul className="max-h-36 list-none space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-2">
              {displayedRecipients.map((recipient) => {
                // Fix #3: O(1) lookup via pre-computed map
                const eligibleIndex = eligibleIndexMap.get(recipient.id) ?? -1;
                const sendLabel = recipient.isValid
                  ? isEmail
                    ? t('messaging.sendEmail')
                    : isSms
                      ? t('messaging.openSmsApp')
                      : t('messaging.openWhatsapp')
                  : t('messaging.skippedStatus');

                return (
                  <RecipientRow
                    key={recipient.id}
                    recipient={recipient}
                    eligibleIndex={eligibleIndex}
                    previewIndex={previewIndex}
                    message={message}
                    isEmail={isEmail}
                    isSms={isSms}
                    disabled={disabled}
                    onPreviewIndexChange={onPreviewIndexChange}
                    onSendOne={onSendOne}
                    onRemove={onRemove}
                    missingAddressLabel={missingAddressLabel}
                    removeLabel={removeLabel}
                    sendLabel={sendLabel}
                  />
                );
              })}
              {displayedRecipients.length === 0 && (
                <li>
                  <EmptyState title={t('messaging.noRecipientsFound')} compact icon={null} />
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      {!isPickStep && eligibleRecipients.length === 0 && (
        <p className="text-xs font-medium text-destructive">{noEligibleMessage}</p>
      )}
    </>
  );
}
