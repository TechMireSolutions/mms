import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { 
  MessageSquare, MessageCircle, Send, 
  Trash2, Clock, Plus, Tag, Filter, Check, Mail, BarChart2, Edit3, Copy, CheckSquare, XSquare, RotateCcw, Sparkles
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Legend, Tooltip 
} from 'recharts';
import { SafeResponsiveContainer } from '@/components/ui/SafeResponsiveContainer';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { ActionButton } from "@/components/ui/ActionButton";
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormSelect } from '@/components/ui/FormSelect';
import { SearchBar } from '@/components/ui/SearchBar';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { ExportToolbar } from '@/components/ui/ExportToolbar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useContactsCollection } from '@/tenant/features/contacts/hooks/useContacts';
import { 
  getDisplayName, 
  getPrimaryPhone, 
  getPrimaryEmail, 
  formatDateTime,
  getInitials,
  mergeMessageTemplates,
  MESSAGE_CATEGORY_OPTIONS,
  MESSAGE_CHANNEL_OPTIONS,
  MESSAGING_MODULE_CONTRACT,
  getChannelBadgeStyle,
  type Message, 
  type MessageCategory,
  type MessageTemplate
} from '@mms/shared';
import MessageComposer, { type MessagingRecipient } from '@/components/ui/MessageComposer';
import { MessagingVariableTokensBar } from '@/components/ui/MessagingVariableTokensBar';
import { SegmentedPillFilter } from '@/components/ui/SegmentedPillFilter';
import { notify } from '@/lib/notify';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useMessageTemplates, useMessageLogs, useMessagingMetrics, useMessagingMutations } from './hooks/useMessaging';


const CHART_COLORS = ['var(--color-info)', 'var(--color-success)', 'var(--color-warning)'];

export default function MessagingPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { can } = usePermissions();

  const contactsCollectionRaw = useContactsCollection();
  const allContacts = useMemo(() => contactsCollectionRaw || [], [contactsCollectionRaw]);

  const contactMap = useMemo(() => {
    const map = new Map<string | number, (typeof allContacts)[number]>();
    allContacts.forEach((c) => map.set(c.id, c));
    return map;
  }, [allContacts]);

  const categorySelectOptions = useMemo(() => [
    { value: 'all', label: t('messaging.category.all') },
    ...MESSAGE_CATEGORY_OPTIONS.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  ], [t]);

  const templateCategorySelectOptions = useMemo(() => 
    MESSAGE_CATEGORY_OPTIONS.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const channelSelectOptions = useMemo(() => 
    MESSAGE_CHANNEL_OPTIONS.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const roleOptions = useMemo(() => 
    MESSAGING_MODULE_CONTRACT.roleOptions.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const genderOptions = useMemo(() => 
    MESSAGING_MODULE_CONTRACT.genderOptions.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const channelFilterOptions = useMemo(() => 
    MESSAGING_MODULE_CONTRACT.channelOptions.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const statusOptions = useMemo(() => 
    MESSAGING_MODULE_CONTRACT.statusOptions.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    })),
  [t]);

  const [activeTab, setActiveTab] = usePersistedTabState<'work' | 'reports' | 'setup'>("messaging_active_tab", "work");
  const [searchContact, setSearchContact] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [searchTemplate, setSearchTemplate] = useState('');
  
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unspecified'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'students' | 'teachers' | 'staff' | 'contacts'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  const [logCategoryFilter, setLogCategoryFilter] = useState<string>('all');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'skipped'>('all');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateLabel, setTemplateLabel] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateCategory, setTemplateCategory] = useState<MessageCategory>('general');
  const [templateChannel, setTemplateChannel] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');

  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [confirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);

  const [selectedRecipients, setSelectedRecipients] = useState<Record<string | number, boolean>>({});
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();

  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup: can('configuration.view'),
  });

  const { templates: customTemplates } = useMessageTemplates();
  const { logs: messageLogs } = useMessageLogs({
    channel: channelFilter,
    category: logCategoryFilter,
    search: searchLog,
    status: statusFilter,
  });

  const { saveTemplate, deleteTemplate, clearLogs } = useMessagingMutations();

  const templates = useMemo(() => {
    return mergeMessageTemplates(customTemplates);
  }, [customTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch = !searchTemplate.trim() || tpl.label.toLowerCase().includes(searchTemplate.toLowerCase()) || tpl.body.toLowerCase().includes(searchTemplate.toLowerCase());
      const matchCategory = templateCategoryFilter === 'all' || (tpl.category || 'general') === templateCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [templates, searchTemplate, templateCategoryFilter]);

  const handleSaveTemplate = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!user) return;
    if (!templateLabel.trim() || !templateBody.trim()) {
      notify.error(t('messaging.createPresetDesc'));
      return;
    }

    saveTemplate.mutate(
      {
        id: editingTemplateId || undefined,
        label: templateLabel.trim(),
        body: templateBody.trim(),
        category: templateCategory,
        channel: templateChannel,
      },
      {
        onSuccess: () => {
          notify.success(t('messaging.saveTemplate'));
          setEditingTemplateId(null);
          setTemplateLabel('');
          setTemplateBody('');
          setTemplateCategory('general');
          setTemplateChannel('all');
        },
      }
    );
  };

  const handleEditTemplateClick = (tpl: MessageTemplate): void => {
    setEditingTemplateId(tpl.id);
    setTemplateLabel(tpl.label);
    setTemplateBody(tpl.body);
    setTemplateCategory(tpl.category || 'general');
    setTemplateChannel(tpl.channel || 'all');
  };

  const handleDuplicateTemplate = (tpl: MessageTemplate): void => {
    if (!user) return;
    saveTemplate.mutate(
      {
        label: `${tpl.label} (${t('messaging.tagCustom')})`,
        body: tpl.body,
        category: tpl.category || 'general',
        channel: tpl.channel || 'all',
      },
      {
        onSuccess: () => {
          notify.success(t('messaging.duplicateSuccess'));
        },
      }
    );
  };

  const handleCopyTemplateBody = (body: string): void => {
    navigator.clipboard.writeText(body);
    notify.success(t('messaging.copySuccess'));
  };

  const handleCancelTemplateEdit = (): void => {
    setEditingTemplateId(null);
    setTemplateLabel('');
    setTemplateBody('');
    setTemplateCategory('general');
    setTemplateChannel('all');
  };

  const insertVariableTag = (tag: string): void => {
    setTemplateBody((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  const confirmDeleteTemplate = (): void => {
    if (!user || !deleteTemplateId) return;
    deleteTemplate.mutate(deleteTemplateId, {
      onSuccess: () => {
        setDeleteTemplateId(null);
        notify.success(t('common.delete'));
      },
    });
  };

  const confirmClearLogs = (): void => {
    if (!user) return;
    clearLogs.mutate(undefined, {
      onSuccess: () => {
        setConfirmClearLogsOpen(false);
        notify.success(t('messaging.clearLogs'));
      },
    });
  };

  const filteredContacts = useMemo(() => {
    return allContacts.filter((c) => {
      const nameMatch = getDisplayName(c).toLowerCase().includes(searchContact.toLowerCase());
      const hasContactInfo = Boolean(getPrimaryPhone(c)) || Boolean(getPrimaryEmail(c));
      const genderMatch = genderFilter === 'all' || (c.gender || 'unspecified').toLowerCase() === genderFilter;
      
      const cObj = c as Record<string, unknown>;
      const cCategory = String(cObj.category || cObj.role || '').toLowerCase();
      let roleMatch = true;
      if (roleFilter === 'students') roleMatch = cCategory.includes('student');
      else if (roleFilter === 'teachers') roleMatch = cCategory.includes('teacher');
      else if (roleFilter === 'staff') roleMatch = cCategory.includes('staff');
      else if (roleFilter === 'contacts') roleMatch = !cCategory.includes('student') && !cCategory.includes('teacher');

      return nameMatch && hasContactInfo && genderMatch && roleMatch;
    });
  }, [allContacts, searchContact, genderFilter, roleFilter]);

  const filteredLogs = useMemo(() => {
    return messageLogs.filter((log) => {
      const channelMatch = channelFilter === 'all' || log.channel === channelFilter;
      const categoryMatch = logCategoryFilter === 'all' || (log.category || 'general') === logCategoryFilter;
      const bodyMatch = log.body.toLowerCase().includes(searchLog.toLowerCase());
      const recipientName = contactMap.get(log.contactId);
      const nameMatch = recipientName 
        ? getDisplayName(recipientName).toLowerCase().includes(searchLog.toLowerCase())
        : false;
      return channelMatch && categoryMatch && (bodyMatch || nameMatch);
    });
  }, [messageLogs, contactMap, searchLog, channelFilter, logCategoryFilter]);

  const handleToggleRecipient = (id: string | number): void => {
    setSelectedRecipients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleAllVisible = (checked: boolean): void => {
    const nextState = { ...selectedRecipients };
    filteredContacts.forEach((c) => {
      if (checked) {
        nextState[c.id] = true;
      } else {
        delete nextState[c.id];
      }
    });
    setSelectedRecipients(nextState);
  };

  const handleSelectAllPhone = (): void => {
    const nextState: Record<string | number, boolean> = {};
    filteredContacts.forEach((c) => {
      if (getPrimaryPhone(c)) {
        nextState[c.id] = true;
      }
    });
    setSelectedRecipients(nextState);
  };

  const handleSelectAllEmail = (): void => {
    const nextState: Record<string | number, boolean> = {};
    filteredContacts.forEach((c) => {
      if (getPrimaryEmail(c)) {
        nextState[c.id] = true;
      }
    });
    setSelectedRecipients(nextState);
  };

  const handleClearSelection = (): void => {
    setSelectedRecipients({});
  };

  const currentSelectedList = useMemo(() => {
    return allContacts
      .filter((c) => selectedRecipients[c.id])
      .map((c) => ({
        id: c.id,
        name: getDisplayName(c),
        phone: getPrimaryPhone(c) || '',
        email: getPrimaryEmail(c) || '',
      }));
  }, [allContacts, selectedRecipients]);

  const allVisibleSelected = filteredContacts.length > 0 && filteredContacts.every((c) => selectedRecipients[c.id]);

  const triggerCompose = (channel: 'sms' | 'whatsapp' | 'email', overrideRecipients?: MessagingRecipient[], initialMsg?: string, initialSubj?: string): void => {
    const targets = overrideRecipients || currentSelectedList;
    if (targets.length === 0) {
      notify.error(t('messaging.selectRecipientsDesc'));
      return;
    }
    openComposer(channel, targets, { initialMessage: initialMsg, initialSubject: initialSubj });
  };

  const handleResendLog = (log: Message): void => {
    const recipient = contactMap.get(log.contactId);
    const targetRecipient: MessagingRecipient = recipient ? {
      id: recipient.id,
      name: getDisplayName(recipient),
      phone: getPrimaryPhone(recipient) || '',
      email: getPrimaryEmail(recipient) || '',
    } : {
      id: log.contactId,
      name: t('messaging.contactFallback', { id: log.contactId }),
      phone: '',
      email: '',
    };

    triggerCompose(log.channel, [targetRecipient], log.body, log.subject);
    notify.success(t('messaging.resendSuccess'));
  };

  const { data: serverMetrics } = useMessagingMetrics();

  const stats = useMemo(() => {
    if (serverMetrics) {
      return {
        total: serverMetrics.total,
        sms: serverMetrics.smsCount,
        wa: serverMetrics.whatsappCount,
        email: serverMetrics.emailCount,
      };
    }
    const total = messageLogs.length;
    const sms = messageLogs.filter((l) => l.channel === 'sms').length;
    const wa = messageLogs.filter((l) => l.channel === 'whatsapp').length;
    const email = messageLogs.filter((l) => l.channel === 'email').length;
    return { total, sms, wa, email };
  }, [serverMetrics, messageLogs]);


  const chartData = useMemo(() => {
    return [
      { name: 'SMS', value: stats.sms },
      { name: 'WhatsApp', value: stats.wa },
      { name: 'Email', value: stats.email },
    ].filter(item => item.value > 0);
  }, [stats]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.messaging')}`}
      seoDescription={t('messaging.subtitle')}
      headerIcon={MessageSquare}
      headerTitle={t('messaging.title')}
      headerSubtitle={t('messaging.subtitle')}
      headerActions={
        <ActionButton
          variant="primary"
          icon={Send}
          onClick={() => {
            setActiveTab("work");
            if (currentSelectedList.length > 0) {
              triggerCompose('whatsapp');
            } else {
              notify.info(t('messaging.selectRecipientsDesc'));
            }
          }}
        >
          {t('messaging.newCampaign')}
        </ActionButton>
      }
      metricsStrip={
        <ModuleCommandMetricsGrid
          items={[
            { icon: Send, label: t('messaging.stats.total'), value: stats.total, accent: 'primary' },
            { icon: MessageSquare, label: t('messaging.stats.sms'), value: stats.sms, accent: 'info' },
            { icon: MessageCircle, label: t('messaging.stats.whatsapp'), value: stats.wa, accent: 'success' },
            { icon: Mail, label: t('messaging.stats.email'), value: stats.email, accent: 'warning' },
          ]}
        />
      }
    >

      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'work' | 'reports' | 'setup')}
        panelIdPrefix="messaging-tab"
      >
        {activeTab === 'work' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">1. {t('messaging.selectRecipients')}</h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> {t('messaging.filterByRole')}:</span>
                    <SegmentedPillFilter
                      options={roleOptions}
                      value={roleFilter}
                      onChange={(v) => setRoleFilter(v as typeof roleFilter)}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{t('contacts.reportFields.gender')}:</span>
                    <SegmentedPillFilter
                      options={genderOptions}
                      value={genderFilter}
                      onChange={(v) => setGenderFilter(v as typeof genderFilter)}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-between">
                <SearchBar
                  placeholder={t('messaging.search.placeholder')}
                  value={searchContact}
                  onChange={setSearchContact}
                  className="flex-grow max-w-sm"
                />

                <div className="flex items-center gap-1.5 text-xs">
                  <Button variant="outline" size="sm" onClick={handleSelectAllPhone} className="h-8 text-[11px] font-semibold">
                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-info" />
                    {t('messaging.selectAllValidPhone')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectAllEmail} className="h-8 text-[11px] font-semibold">
                    <CheckSquare className="w-3.5 h-3.5 mr-1 text-warning" />
                    {t('messaging.selectAllValidEmail')}
                  </Button>
                  {currentSelectedList.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearSelection} className="h-8 text-[11px] text-destructive">
                      <XSquare className="w-3.5 h-3.5 mr-1" />
                      {t('messaging.clearSelection')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="border border-border/60 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={handleToggleAllVisible}
                          aria-label={t('contacts.table.selectAll')}
                        />
                      </th>
                      <th className="px-4 py-2">{t('messaging.recipient')}</th>
                      <th className="px-4 py-2">{t('contacts.form.primaryPhone')}</th>
                      <th className="px-4 py-2">{t('contacts.form.primaryEmail')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredContacts.map((c) => {
                      const phone = getPrimaryPhone(c);
                      const email = getPrimaryEmail(c);
                      return (
                        <tr key={c.id} className="hover:bg-muted/10">
                          <td className="px-4 py-2">
                            <Checkbox
                              checked={!!selectedRecipients[c.id]}
                              onCheckedChange={() => handleToggleRecipient(c.id)}
                              aria-label={`Select ${getDisplayName(c)}`}
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-foreground flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                              {getInitials(getDisplayName(c))}
                            </span>
                            <span>{getDisplayName(c)}</span>
                          </td>
                          <td className="px-4 py-2 font-mono">
                            {phone ? (
                              <span className="text-muted-foreground">{phone}</span>
                            ) : (
                              <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded font-mono">
                                {t('messaging.missingPhone')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {email ? (
                              <span className="text-muted-foreground">{email}</span>
                            ) : (
                              <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded font-mono">
                                {t('messaging.missingEmail')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-muted-foreground">
                          {t('messaging.selectRecipientsDesc')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-border rounded-xl bg-card p-4 space-y-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">2. {t('messaging.confirmRecipients')}</h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.confirmRecipientsDesc')}</p>
                </div>

                <div className="p-3 bg-muted/40 rounded-xl space-y-2 border border-border/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">{t('messaging.contactsChecked')}:</span>
                    <span className="font-bold text-foreground">{currentSelectedList.length}</span>
                  </div>
                  {currentSelectedList.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-border/30 rounded p-1.5 bg-background space-y-1">
                      {currentSelectedList.map((rec) => (
                        <div key={rec.id} className="flex justify-between text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[120px]">{rec.name}</span>
                          <span className="font-mono">{rec.phone || rec.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => triggerCompose('whatsapp')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-xs transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('messaging.sendWhatsapp')}
                </Button>
                <Button
                  onClick={() => triggerCompose('sms')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-info hover:bg-info/90 text-info-foreground font-semibold shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('messaging.sendSms')}
                </Button>
                <Button
                  onClick={() => triggerCompose('email')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-semibold shadow-xs transition-all"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t('messaging.sendEmail')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reports' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="lg:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-grow flex-wrap">
                  <SearchBar
                    placeholder={t('messaging.search.placeholder')}
                    value={searchLog}
                    onChange={setSearchLog}
                    className="flex-grow max-w-xs"
                  />

                  <SegmentedPillFilter
                    options={channelFilterOptions}
                    value={channelFilter}
                    onChange={(v) => setChannelFilter(v as typeof channelFilter)}
                    size="sm"
                  />

                  <SegmentedPillFilter
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as typeof statusFilter)}
                    size="sm"
                  />

                  <FormSelect
                    id="logCategory"
                    value={logCategoryFilter}
                    onChange={setLogCategoryFilter}
                    options={categorySelectOptions}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {filteredLogs.length > 0 && (
                    <ExportToolbar
                      variant="compact"
                      title={t('messaging.tabs.logs')}
                      columns={[
                        { header: t('messaging.recipient'), key: 'recipient' },
                        { header: t('messaging.channel'), key: 'channel' },
                        { header: t('messaging.category'), key: 'category' },
                        { header: t('messaging.messageBody'), key: 'body' },
                        { header: t('messaging.dateSent'), key: 'sentAt' },
                      ]}
                      rows={filteredLogs.map((log) => {
                        const recipient = contactMap.get(log.contactId);
                        const name = recipient ? getDisplayName(recipient) : t('messaging.contactFallback', { id: log.contactId });
                        return {
                          recipient: name,
                          channel: log.channel,
                          category: log.category || 'general',
                          body: log.body,
                          sentAt: formatDateTime(log.sentAt),
                        };
                      })}
                      filename="message_history"
                    />
                  )}
                  {messageLogs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmClearLogsOpen(true)}
                      className="text-destructive hover:bg-destructive/10 font-semibold"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      {t('messaging.clearLogs')}
                    </Button>
                  )}
                </div>
              </div>

              {filteredLogs.length > 0 ? (
                <div className="overflow-x-auto border border-border/50 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">{t('messaging.recipient')}</th>
                        <th className="px-4 py-3">{t('messaging.channel')}</th>
                        <th className="px-4 py-3">{t('messaging.messageBody')}</th>
                        <th className="px-4 py-3">{t('messaging.dateSent')}</th>
                        <th className="px-4 py-3 text-center">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredLogs.map((log) => {
                        const recipient = contactMap.get(log.contactId);
                        const name = recipient ? getDisplayName(recipient) : t('messaging.contactFallback', { id: log.contactId });
                        return (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                {getInitials(name)}
                              </span>
                              <span>{name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${getChannelBadgeStyle(log.channel)}`}>
                                  {log.channel === 'email' ? <Mail className="w-3 h-3" /> : log.channel === 'sms' ? <MessageSquare className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                  {t(`messaging.channel.${log.channel}` as const)}
                                </span>
                                <StatusBadge status={log.status || 'sent'} size="sm" />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={log.body}>
                              {log.body}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {formatDateTime(log.sentAt)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendLog(log)}
                                className="h-7 text-xs text-primary font-semibold hover:bg-primary/10"
                                title={t('messaging.resend')}
                              >
                                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                {t('messaging.resend')}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-sm font-medium">{t('messaging.noLogs')}</p>
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl bg-card p-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-primary" /> {t('messaging.volumeBreakdown')}
                </h4>
                <p className="text-xs text-muted-foreground">{t('messaging.volumeBreakdownDesc')}</p>
              </div>

              {chartData.length > 0 ? (
                <div className="h-[240px] w-full flex items-center justify-center">
                  <SafeResponsiveContainer height={240}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </SafeResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
                  <BarChart2 className="w-8 h-8 opacity-45 mb-2" />
                  <p className="text-xs font-semibold">{t('messaging.noDispatches')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'setup' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    {editingTemplateId ? <Edit3 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
                    {editingTemplateId ? t('messaging.editPreset') : t('messaging.createPreset')}
                  </h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.createPresetDesc')}</p>
                </div>
                {editingTemplateId && (
                  <Button variant="ghost" size="sm" onClick={handleCancelTemplateEdit} className="text-xs">
                    {t('common.cancel')}
                  </Button>
                )}
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="tplLabel">{t('messaging.templateLabel')}</label>
                  <Input
                    id="tplLabel"
                    value={templateLabel}
                    onChange={(e) => setTemplateLabel(e.target.value)}
                    placeholder={t('messaging.templateLabelPlaceholder')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={FORM_LABEL} htmlFor="tplCategory">{t('messaging.category')}</label>
                    <FormSelect
                      id="tplCategory"
                      value={templateCategory}
                      onChange={(v) => setTemplateCategory(v as MessageCategory)}
                      options={templateCategorySelectOptions}
                    />
                  </div>
                  <div>
                    <label className={FORM_LABEL} htmlFor="tplChannel">{t('messaging.targetChannel')}</label>
                    <FormSelect
                      id="tplChannel"
                      value={templateChannel}
                      onChange={(v) => setTemplateChannel(v as 'all' | 'sms' | 'whatsapp' | 'email')}
                      options={channelSelectOptions}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={FORM_LABEL} htmlFor="tplBody">{t('messaging.messageBody')}</label>
                  </div>
                  <MessagingVariableTokensBar
                    onSelectToken={insertVariableTag}
                    className="mb-2"
                  />
                  <Textarea
                    id="tplBody"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder={t('messaging.templateBodyPlaceholder')}
                    rows={4}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground/80 mt-1 italic flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary/70 inline flex-shrink-0" />
                    <span>{t('messaging.fallbackHint')}</span>
                  </p>
                </div>

                <Button type="submit" className="w-full font-bold">
                  <Check className="w-4 h-4 mr-1.5" />
                  {editingTemplateId ? t('messaging.updateTemplate') : t('messaging.saveTemplate')}
                </Button>
              </form>
            </div>

            <div className="md:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4 shadow-xs">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-muted-foreground" /> {t('messaging.configuredPresets')}
                  </h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.configuredPresetsDesc')}</p>
                </div>

                <div className="flex items-center gap-2">
                  <FormSelect
                    id="filterCategory"
                    value={templateCategoryFilter}
                    onChange={setTemplateCategoryFilter}
                    options={categorySelectOptions}
                  />
                  <SearchBar
                    placeholder={t('messaging.search.placeholder')}
                    value={searchTemplate}
                    onChange={setSearchTemplate}
                    className="max-w-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-border/50 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2.5">{t('messaging.templateLabel')}</th>
                      <th className="px-4 py-2.5">{t('messaging.category')}</th>
                      <th className="px-4 py-2.5">{t('messaging.templateCopy')}</th>
                      <th className="px-4 py-2.5 w-32 text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTemplates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {tpl.label}
                          {tpl.channel && tpl.channel !== 'all' && (
                            <span className="ml-1.5 text-[9px] uppercase font-mono px-1 py-0.2 bg-muted text-muted-foreground rounded">
                              {t(`messaging.channel.${tpl.channel}` as const)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            {t(`messaging.category.${tpl.category || 'general'}` as const)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground max-w-sm truncate" title={tpl.body}>
                          {tpl.body}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyTemplateBody(tpl.body)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title={t('messaging.copyTemplate')}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDuplicateTemplate(tpl)}
                              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              title={t('messaging.duplicateTemplate')}
                            >
                              <Copy className="w-3.5 h-3.5 text-primary/70" />
                            </Button>
                            {tpl.id.startsWith('custom_') ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTemplateClick(tpl)}
                                  className="h-7 w-7 text-primary hover:bg-primary/10"
                                  title={t('common.edit')}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteTemplateId(tpl.id)}
                                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                  title={t('common.delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic font-mono uppercase bg-muted/65 px-1.5 py-0.5 rounded border border-border/30">
                                {t('messaging.tagSystem')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-muted-foreground">
                          {t('messaging.noLogs')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </ResponsiveAccordionTabs>

      {messagingTarget && (
        <MessageComposer
          channel={messagingTarget.channel}
          recipients={messagingTarget.recipients}
          templates={templates}
          initialMessage={messagingTarget.initialMessage}
          initialSubject={messagingTarget.initialSubject}
          onClose={() => {
            closeComposer();
            setSelectedRecipients({});
          }}
        />
      )}

      <ConfirmAlertDialog
        open={Boolean(deleteTemplateId)}
        onOpenChange={(open) => { if (!open) setDeleteTemplateId(null); }}
        title={t('messaging.deleteTemplateTitle')}
        description={t('messaging.deleteTemplateDesc')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={confirmDeleteTemplate}
      />

      <ConfirmAlertDialog
        open={confirmClearLogsOpen}
        onOpenChange={setConfirmClearLogsOpen}
        title={t('messaging.clearLogs')}
        description={t('messaging.clearLogsDesc')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={confirmClearLogs}
      />
    </ModulePageShell>
  );
}
