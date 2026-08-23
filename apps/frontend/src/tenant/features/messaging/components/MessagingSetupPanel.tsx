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
import { WORK_SURFACE, WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { SubTabBar } from '@/components/ui/SubTabBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
      await saveTemplate.mutateAsync({
        body: { id: editingId || undefined, label: label.trim(), body: body.trim(), category, channel },
      } as any);
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
        body: {
          label: `${template.label} (${t('messaging.tagCustom')})`,
          body: template.body,
          category: template.category || 'general',
          channel: template.channel || 'all',
        },
      } as any);
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

          <div className={`${WORK_SURFACE} space-y-4 p-4 md:col-span-2`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1"><h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground"><Tag className="h-4 w-4 text-muted-foreground" />{t('messaging.configuredPresets')}</h4><p className="text-xs text-muted-foreground">{t('messaging.configuredPresetsDesc')}</p></div>
              <div className="flex flex-wrap items-center gap-2 overflow-x-auto max-w-full"><FormSelect id="filterCategory" value={categoryFilter} onChange={setCategoryFilter} options={categorySelectOptions} /><SearchBar placeholder={t('messaging.search.placeholder')} value={search} onChange={setSearch} className="max-w-xs" /></div>
            </div>
            <div className="rounded-lg border border-border/50">
              <div className="space-y-3 p-3 md:hidden">
                {filteredTemplates.map((template) => (
                  <article key={template.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
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
                      <Button variant="outline" size="icon" onClick={() => void copyBody(template.body)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-muted-foreground/30 bg-muted-foreground/5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/15 hover:border-muted-foreground/40 shadow-none" title={t('messaging.copyTemplate')} aria-label={t('messaging.copyTemplate')}><Copy className="h-3.5 w-3.5" /></Button>
                      {canWrite && <Button variant="outline" size="icon" onClick={() => void duplicate(template)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/15 hover:border-primary/40 shadow-none" title={t('messaging.duplicateTemplate')} aria-label={t('messaging.duplicateTemplate')}><Files className="h-3.5 w-3.5" /></Button>}
                      {canWrite && template.id.startsWith('custom_') ? (
                        <>
                          <Button variant="outline" size="icon" onClick={() => edit(template)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-info/30 bg-info/5 text-info hover:text-info hover:bg-info/15 hover:border-info/40 shadow-none" title={t('common.edit')} aria-label={t('common.edit')}><Edit3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="outline" size="icon" onClick={() => onDeleteRequest(template.id)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:text-destructive hover:bg-destructive/15 hover:border-destructive/40 shadow-none" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
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
              <div className="hidden md:block">
                <Table className="table-fixed text-start text-xs">
                  <TableHeader className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                    <TableRow className="border-b border-border/60">
                      {(['label', 'category', 'body'] as const).map((column) => <ResizableTableHead key={column} columnKey={column} width={getColumnWidth(column)} onResize={setColumnWidth} className="px-4 py-2.5">{column === 'label' ? t('messaging.templateLabel') : column === 'category' ? t('messaging.category') : t('messaging.templateCopy')}</ResizableTableHead>)}
                      <TableHead className="w-32 px-4 py-2.5 text-center">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60">
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id} className="transition-colors hover:bg-muted/5">
                        <TableCell className="flex items-center gap-1.5 px-4 py-3 font-semibold text-foreground"><span>{template.labelKey ? t(template.labelKey as Parameters<typeof t>[0]) : template.label}</span>{template.channel && template.channel !== 'all' && <ChannelBadge channel={template.channel} className="text-xs" />}</TableCell>
                        <TableCell className="px-4 py-3"><StatusBadge status={template.category || 'general'} config={categoryBadgeConfig} size="sm" /></TableCell>
                        <TableCell className="max-w-sm truncate px-4 py-3 text-muted-foreground" title={template.body}>{template.body}</TableCell>
                        <TableCell className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="icon" onClick={() => void copyBody(template.body)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-muted-foreground/30 bg-muted-foreground/5 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/15 hover:border-muted-foreground/40 shadow-none" title={t('messaging.copyTemplate')} aria-label={t('messaging.copyTemplate')}><Copy className="h-3.5 w-3.5" /></Button>
                          {canWrite && <Button variant="outline" size="icon" onClick={() => void duplicate(template)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/15 hover:border-primary/40 shadow-none" title={t('messaging.duplicateTemplate')} aria-label={t('messaging.duplicateTemplate')}><Files className="h-3.5 w-3.5" /></Button>}
                          {canWrite && template.id.startsWith('custom_') ? <><Button variant="outline" size="icon" onClick={() => edit(template)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-info/30 bg-info/5 text-info hover:text-info hover:bg-info/15 hover:border-info/40 shadow-none" title={t('common.edit')} aria-label={t('common.edit')}><Edit3 className="h-3.5 w-3.5" /></Button><Button variant="outline" size="icon" onClick={() => onDeleteRequest(template.id)} className="h-7 w-7 min-h-7 min-w-7 rounded-lg border-destructive/30 bg-destructive/5 text-destructive hover:text-destructive hover:bg-destructive/15 hover:border-destructive/40 shadow-none" title={t('common.delete')} aria-label={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></Button></> : <span className="rounded border border-border/30 bg-muted/65 px-1.5 py-0.5 font-mono text-xs italic uppercase text-muted-foreground/60">{t('messaging.tagSystem')}</span>}
                        </div></TableCell>
                      </TableRow>
                    ))}
                    {filteredTemplates.length === 0 && <TableRow><TableCell colSpan={4} className="py-4"><EmptyState title={t('messaging.noTemplates')} compact /></TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
