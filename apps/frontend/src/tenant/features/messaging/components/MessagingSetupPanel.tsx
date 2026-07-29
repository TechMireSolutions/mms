import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Edit3, Plus, Sparkles, Tag, Trash2 } from 'lucide-react';
import {
  appendVariableToken,
  mergeMessageTemplates,
  type MessageCategory,
  type MessageTemplate,
} from '@mms/shared';
import { Button } from '@/components/ui/button';
import { ChannelBadge } from '@/components/ui/ChannelBadge';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { MessagingVariableTokensBar } from '@/components/ui/MessagingVariableTokensBar';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMessageTemplates, useMessagingMutations } from '../hooks/useMessaging';
import { useMessagingTemplatesColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';

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
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<MessageCategory>('general');
  const [channel, setChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
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
        onRetry={() => {
          void templatesQuery.refetch();
        }}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
        {canEditSetup || canWrite ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <h4 className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-foreground">
                  {editingId ? <Edit3 className="h-4 w-4 shrink-0 text-primary" /> : <Plus className="h-4 w-4 shrink-0 text-primary" />}
                  <span className="min-w-0 truncate">{editingId ? t('messaging.editPreset') : t('messaging.createPreset')}</span>
                </h4>
                <p className="text-xs text-muted-foreground">{t('messaging.createPresetDesc')}</p>
              </div>
              {editingId && <Button variant="ghost" size="sm" onClick={resetForm} className="shrink-0 self-start text-xs">{t('common.cancel')}</Button>}
            </div>
            <form onSubmit={(event) => void save(event)} className="space-y-3">
              <div><label className={FORM_LABEL} htmlFor="tplLabel">{t('messaging.templateLabel')}</label><Input id="tplLabel" value={label} onChange={(event) => setLabel(event.target.value)} placeholder={t('messaging.templateLabelPlaceholder')} required /></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div><label className={FORM_LABEL} htmlFor="tplCategory">{t('messaging.category')}</label><FormSelect id="tplCategory" value={category} onChange={(value) => setCategory(value as MessageCategory)} options={templateCategorySelectOptions} /></div>
                <div><label className={FORM_LABEL} htmlFor="tplChannel">{t('messaging.targetChannel')}</label><FormSelect id="tplChannel" value={channel} onChange={(value) => setChannel(value as typeof channel)} options={channelSelectOptions} /></div>
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="tplBody">{t('messaging.messageBody')}</label>
                <MessagingVariableTokensBar onSelectToken={(token) => setBody((current) => appendVariableToken(current, token))} className="mb-2" />
                <Textarea id="tplBody" value={body} onChange={(event) => setBody(event.target.value)} placeholder={t('messaging.templateBodyPlaceholder')} rows={4} required />
                <p className="mt-1 flex items-center gap-1 text-xs italic text-muted-foreground/80"><Sparkles className="h-3 w-3 flex-shrink-0 text-primary/70" />{t('messaging.fallbackHint')}</p>
              </div>
              <Button type="submit" className="w-full font-bold"><Check className="me-1.5 h-4 w-4" />{editingId ? t('messaging.updateTemplate') : t('messaging.saveTemplate')}</Button>
            </form>
          </>
        ) : (
          <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">{t('messaging.setup.readOnly')}</p>
        )}
      </div>

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
                  {canWrite && <Button variant="ghost" size="icon" onClick={() => void duplicate(template)} className="text-muted-foreground" title={t('messaging.duplicateTemplate')} aria-label={t('messaging.duplicateTemplate')}><Copy className="h-3.5 w-3.5 text-primary/70" /></Button>}
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
              <p className="py-6 text-center text-sm text-muted-foreground">{t('messaging.noLogs')}</p>
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
                      <Button variant="ghost" size="icon" onClick={() => void copyBody(template.body)} className="text-muted-foreground" title={t('messaging.copyTemplate')}><Copy className="h-3.5 w-3.5" /></Button>
                      {canWrite && <Button variant="ghost" size="icon" onClick={() => void duplicate(template)} className="text-muted-foreground" title={t('messaging.duplicateTemplate')}><Copy className="h-3.5 w-3.5 text-primary/70" /></Button>}
                      {canWrite && template.id.startsWith('custom_') ? <><Button variant="ghost" size="icon" onClick={() => edit(template)} className="text-primary" title={t('common.edit')}><Edit3 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => onDeleteRequest(template.id)} className="text-destructive" title={t('common.delete')}><Trash2 className="h-3.5 w-3.5" /></Button></> : <span className="rounded border border-border/30 bg-muted/65 px-1.5 py-0.5 font-mono text-xs italic uppercase text-muted-foreground/60">{t('messaging.tagSystem')}</span>}
                    </div></td>
                  </tr>
                ))}
                {filteredTemplates.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">{t('messaging.noLogs')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
