import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Filter, Mail, MessageCircle, MessageSquare, XSquare } from 'lucide-react';
import {
  CONTACTS_MODULE_MANIFEST,
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  toMessagingRecipient,
  type Contact,
  type MessagingGenderFilter,
  type MessagingRoleFilter,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListPagination } from '@/components/ui/ListPagination';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useMessagingRecipientsColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import {
  loadMatchingRecipients,
  useMessagingWorkRecipients,
} from '../hooks/useMessagingWorkRecipients';

function contactToRecipient(contact: Contact): MessagingRecipient {
  return toMessagingRecipient(contact, {
    getDisplayName,
    getPrimaryPhone,
    getPrimaryEmail,
  });
}

/** Selected Work recipients keyed by contact id (snapshots — no async resolve race). */
export type MessagingSelectedMap = Record<string, MessagingRecipient>;

interface MessagingWorkPanelProps {
  canWrite: boolean;
  selectedById: MessagingSelectedMap;
  selectedList: MessagingRecipient[];
  onSelectedByIdChange: (recipients: MessagingSelectedMap) => void;
  onCompose: (channel: 'sms' | 'whatsapp' | 'email') => void;
}

export function MessagingWorkPanel({
  canWrite,
  selectedById,
  selectedList,
  onSelectedByIdChange,
  onCompose,
}: MessagingWorkPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { roleOptions, genderOptions } = useMessagingPageOptions();
  const [searchContact, setSearchContact] = useState('');
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [genderFilter, setGenderFilter] = useState<MessagingGenderFilter>('all');
  const [roleFilter, setRoleFilter] = useState<MessagingRoleFilter>('all');
  const [selectingReachable, setSelectingReachable] = useState(false);
  const debouncedSearch = useDebounce(searchContact, 250);

  useEffect(() => setRecipientsPage(1), [debouncedSearch, genderFilter, roleFilter]);

  const recipientsQuery = useMessagingWorkRecipients({
    roleFilter,
    genderFilter,
    search: debouncedSearch,
    page: recipientsPage,
    pageSize: CONTACTS_MODULE_MANIFEST.defaultPageSize,
  });
  const contacts = recipientsQuery.contacts;
  const { getColumnWidth, setColumnWidth } = useMessagingRecipientsColumnLayout();
  const allVisibleSelected = contacts.length > 0 && contacts.every((contact) => Boolean(selectedById[String(contact.id)]));

  const toggleRecipient = (contact: Contact): void => {
    const key = String(contact.id);
    const next = { ...selectedById };
    if (next[key]) delete next[key];
    else next[key] = contactToRecipient(contact);
    onSelectedByIdChange(next);
  };

  const toggleAllVisible = (checked: boolean): void => {
    const next = { ...selectedById };
    contacts.forEach((contact) => {
      const key = String(contact.id);
      if (checked) next[key] = contactToRecipient(contact);
      else delete next[key];
    });
    onSelectedByIdChange(next);
  };

  const selectReachable = async (kind: 'phone' | 'email'): Promise<void> => {
    if (selectingReachable) return;
    setSelectingReachable(true);
    try {
      const { contacts: matched, truncated } = await loadMatchingRecipients({
        roleFilter,
        genderFilter,
        search: debouncedSearch,
        kind,
      });
      const next: MessagingSelectedMap = {};
      for (const contact of matched) {
        next[String(contact.id)] = contactToRecipient(contact);
      }
      onSelectedByIdChange(next);
      if (truncated) notify.warning(t('messaging.selectAllTruncated'));
    } catch {
      notify.error(t('messaging.loadFailed'));
    } finally {
      setSelectingReachable(false);
    }
  };

  if (recipientsQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
        onRetry={() => {
          recipientsQuery.refetch();
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{t('messaging.stepSelectRecipients')}</h4>
            <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" /> {t('messaging.filterByRole')}:
              </span>
              <SegmentedPillFilter options={roleOptions} value={roleFilter} onChange={(value) => setRoleFilter(value as MessagingRoleFilter)} size="sm" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t('contacts.reportFields.gender')}:</span>
              <SegmentedPillFilter options={genderOptions} value={genderFilter} onChange={(value) => setGenderFilter(value as MessagingGenderFilter)} size="sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchBar placeholder={t('messaging.search.placeholder')} value={searchContact} onChange={setSearchContact} className="max-w-sm flex-grow" />
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto max-w-full text-xs">
            <Button
              variant="outline"
              size="sm"
              disabled={selectingReachable}
              onClick={() => void selectReachable('phone')}
              className="text-xs font-semibold"
            >
              <CheckSquare className="me-1 h-3.5 w-3.5 text-info" /> {t('messaging.selectAllValidPhone')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectingReachable}
              onClick={() => void selectReachable('email')}
              className="text-xs font-semibold"
            >
              <CheckSquare className="me-1 h-3.5 w-3.5 text-warning" /> {t('messaging.selectAllValidEmail')}
            </Button>
            {selectedList.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onSelectedByIdChange({})} className="text-xs text-destructive">
                <XSquare className="me-1 h-3.5 w-3.5" /> {t('messaging.clearSelection')}
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-[23.75rem] max-w-full overflow-y-auto rounded-lg border border-border/60">
          <div className="space-y-3 p-3 md:hidden">
            {contacts.length > 0 && (
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label={t('contacts.table.selectAll')} />
                <span className="text-xs font-semibold text-muted-foreground">{t('contacts.table.selectAll')}</span>
              </div>
            )}
            {contacts.map((contact) => {
              const phone = getPrimaryPhone(contact);
              const email = getPrimaryEmail(contact);
              const displayName = getDisplayName(contact);
              return (
                <article key={contact.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={Boolean(selectedById[String(contact.id)])}
                      onCheckedChange={() => toggleRecipient(contact)}
                      aria-label={t('messaging.selectRecipient', { name: displayName })}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {getInitials(displayName)}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 ps-8 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t('contacts.form.primaryPhone')}</dt>
                      <dd className="font-mono text-xs text-foreground">
                        {phone || <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">{t('messaging.missingPhone')}</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t('contacts.form.primaryEmail')}</dt>
                      <dd className="text-xs text-foreground">
                        {email || <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">{t('messaging.missingEmail')}</span>}
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })}
            {contacts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-fixed text-start text-xs">
              <thead className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border/60">
                  <th className="w-10 px-4 py-2">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} aria-label={t('contacts.table.selectAll')} />
                  </th>
                  {(['recipient', 'phone', 'email'] as const).map((column) => (
                    <ResizableTableHead key={column} columnKey={column} width={getColumnWidth(column)} onResize={setColumnWidth} className="px-4 py-2">
                      {column === 'recipient' ? t('messaging.recipient') : t(`contacts.form.primary${column === 'phone' ? 'Phone' : 'Email'}`)}
                    </ResizableTableHead>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contacts.map((contact) => {
                  const phone = getPrimaryPhone(contact);
                  const email = getPrimaryEmail(contact);
                  return (
                    <tr key={contact.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={Boolean(selectedById[String(contact.id)])}
                          onCheckedChange={() => toggleRecipient(contact)}
                          aria-label={t('messaging.selectRecipient', { name: getDisplayName(contact) })}
                        />
                      </td>
                      <td className="flex items-center gap-2 px-4 py-2 font-medium text-foreground">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                          {getInitials(getDisplayName(contact))}
                        </span>
                        <span>{getDisplayName(contact)}</span>
                      </td>
                      <td className="px-4 py-2 font-mono">{phone || <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">{t('messaging.missingPhone')}</span>}</td>
                      <td className="px-4 py-2">{email || <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">{t('messaging.missingEmail')}</span>}</td>
                    </tr>
                  );
                })}
                {contacts.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">{t('messaging.selectRecipientsDesc')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <ListPagination page={recipientsQuery.page} total={recipientsQuery.total} limit={recipientsQuery.limit} hasMore={recipientsQuery.hasMore} onPageChange={setRecipientsPage} i18nNamespace="contacts" variant="range" />
      </div>

      <div className="flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">{t('messaging.stepConfirmDispatch')}</h4>
            <p className="text-xs text-muted-foreground">{t('messaging.confirmRecipientsDesc')}</p>
          </div>
          <div className="space-y-2 rounded-xl border border-border/40 bg-muted/40 p-3">
            <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{t('messaging.contactsChecked')}:</span><span className="font-bold">{selectedList.length}</span></div>
            {selectedList.length > 0 && <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-border/30 bg-background p-1.5">{selectedList.map((recipient) => <div key={recipient.id} className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground"><span className="min-w-0 truncate">{recipient.name}</span><span className="shrink-0 font-mono truncate max-w-[50%]">{recipient.phone || recipient.email}</span></div>)}</div>}
          </div>
        </div>
        {canWrite && (
          <div className="space-y-2">
            <Button onClick={() => onCompose('whatsapp')} disabled={!selectedList.length} className="w-full bg-success font-semibold text-success-foreground hover:bg-success/90"><MessageCircle className="me-2 h-4 w-4" />{t('messaging.sendWhatsapp')}</Button>
            <Button onClick={() => onCompose('sms')} disabled={!selectedList.length} className="w-full bg-info font-semibold text-info-foreground hover:bg-info/90"><MessageSquare className="me-2 h-4 w-4" />{t('messaging.sendSms')}</Button>
            <Button onClick={() => onCompose('email')} disabled={!selectedList.length} className="w-full bg-warning font-semibold text-warning-foreground hover:bg-warning/90"><Mail className="me-2 h-4 w-4" />{t('messaging.sendEmail')}</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
