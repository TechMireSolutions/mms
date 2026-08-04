import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Edit3, Files, Tag, Trash2 } from 'lucide-react';
import {
  MESSAGING_MODULE_MANIFEST,
  mergeMessageTemplates,
  type MessageCategory,
  type MessageTemplate,
  findUnknownPersonalizationTokens,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormSelect } from '@/components/ui/FormSelect';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { SubTabBar } from '@/components/ui/SubTabBar';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMessageTemplates, useMessagingMutations } from '../hooks/useMessaging';
import { useMessagingTemplatesColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import { MessagingSetupTemplateForm } from './MessagingSetupTemplateForm';

interface MessagingSetupPanelProps {
  canWrite: boolean;
  canEditSetup: boolean;
  onDeleteRequest: (templateId: string) => void;
}

export function MessagingSetupPanel({
  canWrite,
  canEditSetup,
  onDeleteRequest,
}: MessagingSetupPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { categorySelectOptions, templateCategorySelectOptions, channelSelectOptions, categoryBadgeConfig } = useMessagingPageOptions();
  const templatesQuery = useMessageTemplates();
  const { saveTemplate } = useMessagingMutations();
  const { getColumnWidth, setColumnWidth } = useMessagingTemplatesColumnLayout();
  const [setupSubTab, setSetupSubTab] = useState<string>(MESSAGING_MODULE_MANIFEST.setupSubTabs[0]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MessageCategory>('general');
  const [channel, setChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  const setupTabs = useMemo(
    () => MESSAGING_MODULE_MANIFEST.setupSubTabs.map((key) => ({
      key,
      label: t('messaging.tabs.templates'),
    })),
    [t],
  );
  const templates = useMemo(() => mergeMessageTemplates(templatesQuery.templates), [templatesQuery.templates]);
  const filteredTemplates = useMemo(() => templates.filter((template) => (
    (!search.trim() || template.label.toLowerCase().includes(search.toLowerCase()) || template.body.toLowerCase().includes(search.toLowerCase()))
    && (categoryFilter === 'all' || (template.category || 'general') === categoryFilter)
  )), [categoryFilter, search, templates]);

  const resetForm = (): void => {
    setEditingId(null);
    setLabel('');
    setBody('');
    setCategory('general');
    setChannel('all');
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user) return;
    if (!label.trim() || !body.trim()) {
      notify.error(t('messaging.createPresetDesc'));
      return;
    }
    const unknownTokens = findUnknownPersonalizationTokens(body.trim());
    if (unknownTokens.length > 0) {
      notify.error(t('messaging.unknownTokens', {
        tokens: unknownTokens.map((token) => `{${token}}`).join(', '),
      }));
      return;
    }
    try {
      await saveTemplate.mutateAsync({ id: editingId || undefined, label: label.trim(), body: body.trim(), category, channel });
      notify.success(t('messaging.saveTemplate'));
      resetForm();
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const edit = (template: MessageTemplate): void => {
    setEditingId(template.id);
    setLabel(template.label);
    setBody(template.body);
    setCategory(template.category || 'general');
    setChannel(template.channel || 'all');
  };

  const duplicate = async (template: MessageTemplate): Promise<void> => {
    if (!user) return;
    const unknownTokens = findUnknownPersonalizationTokens(template.body);
    if (unknownTokens.length > 0) {
      notify.error(t('messaging.unknownTokens', {
        tokens: unknownTokens.map((token) => `{${token}}`).join(', '),
      }));
      return;
    }
    try {
      await saveTemplate.mutateAsync({
        label: `${template.label} (${t('messaging.tagCustom')})`,
        body: template.body,
        category: template.category || 'general',
        channel: template.channel || 'all',
      });
      notify.success(t('messaging.duplicateSuccess'));
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const copyBody = async (templateBody: string): Promise<void> => {
    await navigator.clipboard.writeText(templateBody);
    notify.success(t('messaging.copySuccess'));
  };

  if (templatesQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
        description={t('messaging.loadFailedHint')}
        onRetry={() => {
          void templatesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SubTabBar tabs={setupTabs} value={setupSubTab} onChange={setSetupSubTab} />
      {setupSubTab === 'templates' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <MessagingSetupTemplateForm
            canEditSetup={canEditSetup}
            editingId={editingId}
            label={label}
            body={body}
            category={category}
            channel={channel}
            templateCategorySelectOptions={templateCategorySelectOptions}
            channelSelectOptions={channelSelectOptions}
            onReset={resetForm}
            onSave={(event) => void save(event)}
            onLabelChange={setLabel}
            onBodyChange={setBody}
            onCategoryChange={setCategory}
            onChannelChange={setChannel}
          />

          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1"><h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Tag className="h-4 w-4 text-muted-foreground" />{t('messaging.configuredPresets')}</h4><p className="text-xs text-muted-foreground">{t('messaging.configuredPresetsDesc')}</p></div>
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full"><FormSelect id="filterCategory" value={categoryFilter} onChange={setCategoryFilter} options={categorySelectOptions} /><SearchBar placeholder={t('messaging.search.placeholder')} value={search} onChange={setSearch} className="max-w-xs" /></div>
            </div>
            <div className="rounded-lg border border-border/50">
              <div className="space-y-3 p-3 md:hidden">
                {filteredTemplates.map((template) => (
                  <article key={template.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          {template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label}
                        </h4>
                        {template.channel && template.channel !== 'all' && (
                          <div className="mt-1"><ChannelBadge channel={template.channel} className="text-xs" /></div>
                        )}
                      </div>
                      <StatusBadge status={template.category || 'general'} config={categoryBadgeConfig} size="sm" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">{t('messaging.templateCopy')}</p>
                      <p className="text-xs text-muted-foreground">{template.body}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => void copyBody(template.body)} className="text-muted-foreground" title={t('messaging.copyTemplate')} aria-label={t('messaging.copyTemplate')}><Copy className="h-3.5 w-3.5" /></Button>
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => void duplicate(template)} className="text-muted-foreground" title={t('messaging.duplicateTemplate')} aria-label={t('messaging.duplicateTemplate')}><Files className="h-3.5 w-3.5 text-primary/70" /></Button>}
                      {canWrite && template.id.startsWith('custom_') ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => edit(template)} className="text-primary" title={t('common.edit')} aria-label={t('common.edit')}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteRequest(template.id)} className="text-destructive" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </>
                      ) : (
                        <span className="rounded border border-border/30 bg-muted/65 px-1.5 py-0.5 font-mono text-xs italic uppercase text-muted-foreground/60">{t('messaging.tagSystem')}</span>
                      )}
                    </div>
                  </article>
                ))}
                {filteredTemplates.length === 0 && (
                  <EmptyState title={t('messaging.noTemplates')} compact />
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full table-fixed text-start text-xs">
                  <thead className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr className="border-b border-border/60">
                      {(['label', 'category', 'body'] as const).map((column) => <ResizableTableHead key={column} columnKey={column} width={getColumnWidth(column)} onResize={setColumnWidth} className="px-4 py-2.5">{column === 'label' ? t('messaging.templateLabel') : column === 'category' ? t('messaging.category') : t('messaging.templateCopy')}</ResizableTableHead>)}
                      <th className="w-32 px-4 py-2.5 text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTemplates.map((template) => (
                      <tr key={template.id} className="transition-colors hover:bg-muted/5">
                        <td className="flex items-center gap-1.5 px-4 py-3 font-semibold text-foreground"><span>{template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label}</span>{template.channel && template.channel !== 'all' && <ChannelBadge channel={template.channel} className="text-xs" />}</td>
                        <td className="px-4 py-3"><StatusBadge status={template.category || 'general'} config={categoryBadgeConfig} size="sm" /></td>
                        <td className="max-w-sm truncate px-4 py-3 text-muted-foreground" title={template.body}>{template.body}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => void copyBody(template.body)} className="text-muted-foreground" title={t('messaging.copyTemplate')} aria-label={t('messaging.copyTemplate')}><Copy className="h-3.5 w-3.5" /></Button>
                          {canWrite && <Button variant="ghost" size="icon" onClick={() => void duplicate(template)} className="text-muted-foreground" title={t('messaging.duplicateTemplate')} aria-label={t('messaging.duplicateTemplate')}><Files className="h-3.5 w-3.5 text-primary/70" /></Button>}
                          {canWrite && template.id.startsWith('custom_') ? <><Button variant="ghost" size="icon" onClick={() => edit(template)} className="text-primary" title={t('common.edit')} aria-label={t('common.edit')}><Edit3 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => onDeleteRequest(template.id)} className="text-destructive" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></Button></> : <span className="rounded border border-border/30 bg-muted/65 px-1.5 py-0.5 font-mono text-xs italic uppercase text-muted-foreground/60">{t('messaging.tagSystem')}</span>}
                        </div></td>
                      </tr>
                    ))}
                    {filteredTemplates.length === 0 && <tr><td colSpan={4} className="py-4"><EmptyState title={t('messaging.noTemplates')} compact /></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
