import React, { useState, useMemo, useEffect } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { 
  MessageSquare, MessageCircle, Send, 
  Trash2, User, Clock, Plus, Tag, Filter, Check, Mail, BarChart2, Download, Edit3
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
import { SearchBar } from '@/components/ui/SearchBar';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { getCollection, saveCollection } from '@/lib/db';
import { useContactsCollection } from '@/tenant/features/contacts/hooks/useContacts';
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, formatDate, type Message } from '@mms/shared';
import MessageComposer, { type MessagingRecipient, type MessageTemplate } from '@/components/ui/MessageComposer';
import { notify } from '@/lib/notify';
import { FORM_LABEL } from '@/components/ui/formStyles';

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  { id: 't1', label: 'General Announcement', body: 'Dear {name}, we would like to inform you that...' },
  { id: 't2', label: 'Payment Reminder', body: 'Dear {name}, this is a friendly reminder that your balance payment is due.' },
  { id: 't3', label: 'Holiday Announcement', body: 'Dear {name}, please note that the madrasa will remain closed on...' },
];

const CHART_COLORS = ['var(--color-info)', 'var(--color-success)', 'var(--color-warning)']; // Info (SMS), Success (WA), Warning (Email)

export default function MessagingPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { can } = usePermissions();

  // Load all system contacts using the contacts hook
  const contactsCollectionRaw = useContactsCollection();
  const allContacts = useMemo(() => contactsCollectionRaw || [], [contactsCollectionRaw]);

  const [localTick, setLocalTick] = useState(0);
  useEffect(() => {
    const handler = () => setLocalTick((n) => n + 1);
    window.addEventListener('local-database-update', handler);
    return () => window.removeEventListener('local-database-update', handler);
  }, []);

  // Local state
  const [activeTab, setActiveTab] = usePersistedTabState<'work' | 'reports' | 'setup'>("messaging_active_tab", "work");
  const [searchContact, setSearchContact] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [searchTemplate, setSearchTemplate] = useState('');
  
  // Advanced filters
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unspecified'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  
  // Custom templates form state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateLabel, setTemplateLabel] = useState('');
  const [templateBody, setTemplateBody] = useState('');

  // Dialog states for confirmations
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [confirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);

  const [selectedRecipients, setSelectedRecipients] = useState<Record<string | number, boolean>>({});
  const [composerTarget, setComposerTarget] = useState<{ channel: 'sms' | 'whatsapp' | 'email'; recipients: MessagingRecipient[] } | null>(null);

  // Hide the setup tab if the user has no configuration permissions
  const visibleTabs = useFilteredModuleTierTabs({
    canViewSetup: can('configuration.view'),
  });

  // Load templates from DB (merged with defaults)
  const templates = useMemo(() => {
    const _tick = localTick; // re-evaluate on local database update
    if (!user) return DEFAULT_TEMPLATES;
    const dbKey = `messages_templates_u:${user.id}`;
    const custom = getCollection<MessageTemplate>(dbKey) || [];
    return [...DEFAULT_TEMPLATES, ...custom];
  }, [user, localTick]);

  const filteredTemplates = useMemo(() => {
    if (!searchTemplate.trim()) return templates;
    const q = searchTemplate.toLowerCase();
    return templates.filter((tpl) => tpl.label.toLowerCase().includes(q) || tpl.body.toLowerCase().includes(q));
  }, [templates, searchTemplate]);

  // Handle template creation or update
  const handleSaveTemplate = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!user) return;
    if (!templateLabel.trim() || !templateBody.trim()) {
      notify.error('Please specify both template label and body');
      return;
    }
    const dbKey = `messages_templates_u:${user.id}`;
    const custom = getCollection<MessageTemplate>(dbKey) || [];

    if (editingTemplateId) {
      const updated = custom.map((tpl) => 
        tpl.id === editingTemplateId 
          ? { ...tpl, label: templateLabel.trim(), body: templateBody.trim() }
          : tpl
      );
      saveCollection(dbKey, updated);
      notify.success('Template updated successfully');
    } else {
      const newTpl: MessageTemplate = {
        id: `custom_${Date.now()}`,
        label: templateLabel.trim(),
        body: templateBody.trim(),
      };
      saveCollection(dbKey, [...custom, newTpl]);
      notify.success('Custom message template saved successfully');
    }

    setEditingTemplateId(null);
    setTemplateLabel('');
    setTemplateBody('');
  };

  const handleEditTemplateClick = (tpl: MessageTemplate): void => {
    setEditingTemplateId(tpl.id);
    setTemplateLabel(tpl.label);
    setTemplateBody(tpl.body);
  };

  const handleCancelTemplateEdit = (): void => {
    setEditingTemplateId(null);
    setTemplateLabel('');
    setTemplateBody('');
  };

  const insertVariableTag = (tag: string): void => {
    setTemplateBody((prev) => (prev ? `${prev} ${tag}` : tag));
  };


  // Handle template deletion confirm action
  const confirmDeleteTemplate = (): void => {
    if (!user || !deleteTemplateId) return;
    const dbKey = `messages_templates_u:${user.id}`;
    const custom = getCollection<MessageTemplate>(dbKey) || [];
    const updated = custom.filter((tpl) => tpl.id !== deleteTemplateId);
    saveCollection(dbKey, updated);
    setDeleteTemplateId(null);
    notify.success('Template deleted successfully');
  };

  // Load sent messages history from DB
  const messageLogs = useMemo(() => {
    const _tick = localTick; // re-evaluate on local database update
    if (!user) return [];
    const dbKey = `messages_u:${user.id}`;
    return getCollection<Message>(dbKey) || [];
  }, [user, localTick]);

  // Handle clearing log history confirm action
  const confirmClearLogs = (): void => {
    if (!user) return;
    saveCollection(`messages_u:${user.id}`, []);
    setConfirmClearLogsOpen(false);
    notify.success('Message logs cleared successfully');
  };

  // Filter contacts to find eligible recipients (those with phone numbers or email address and matching filters)
  const filteredContacts = useMemo(() => {
    return allContacts.filter((c) => {
      const nameMatch = getDisplayName(c).toLowerCase().includes(searchContact.toLowerCase());
      const hasContactInfo = Boolean(getPrimaryPhone(c)) || Boolean(getPrimaryEmail(c));
      const genderMatch = genderFilter === 'all' || (c.gender || 'unspecified').toLowerCase() === genderFilter;
      return nameMatch && hasContactInfo && genderMatch;
    });
  }, [allContacts, searchContact, genderFilter]);

  // Filter message history logs
  const filteredLogs = useMemo(() => {
    return messageLogs.filter((log) => {
      const channelMatch = channelFilter === 'all' || log.channel === channelFilter;
      const bodyMatch = log.body.toLowerCase().includes(searchLog.toLowerCase());
      const recipientName = allContacts.find((c) => c.id === log.contactId);
      const nameMatch = recipientName 
        ? getDisplayName(recipientName).toLowerCase().includes(searchLog.toLowerCase())
        : false;
      return channelMatch && (bodyMatch || nameMatch);
    });
  }, [messageLogs, allContacts, searchLog, channelFilter]);

  // Toggle single recipient select state
  const handleToggleRecipient = (id: string | number): void => {
    setSelectedRecipients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Select/Deselect all filtered contacts
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

  // Map selected IDs back to recipient details
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

  // Open Composer Dialog
  const triggerCompose = (channel: 'sms' | 'whatsapp' | 'email'): void => {
    if (currentSelectedList.length === 0) {
      notify.error('Please select at least one recipient first.');
      return;
    }
    setComposerTarget({
      channel,
      recipients: currentSelectedList,
    });
  };

  // Metrics
  const stats = useMemo(() => {
    const total = messageLogs.length;
    const sms = messageLogs.filter((l) => l.channel === 'sms').length;
    const wa = messageLogs.filter((l) => l.channel === 'whatsapp').length;
    const email = messageLogs.filter((l) => l.channel === 'email').length;
    return { total, sms, wa, email };
  }, [messageLogs]);

  // Chart Data
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

      {/* Accordion Tabs Wrapper */}
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'work' | 'reports' | 'setup')}
        panelIdPrefix="messaging-tab"
      >
        {activeTab === 'work' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recipient Selector list */}
            <div className="lg:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">1. {t('messaging.selectRecipients')}</h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
                </div>

                {/* Gender Filter Segmented Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> {t('contacts.reportFields.gender')}:</span>
                  <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]">
                    {(['all', 'male', 'female', 'unspecified'] as const).map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setGenderFilter(gender)}
                        className={`px-2 py-0.5 rounded-md font-bold uppercase transition-all ${
                          genderFilter === gender 
                            ? 'bg-background shadow-sm text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <SearchBar
                placeholder={t('messaging.search.placeholder')}
                value={searchContact}
                onChange={setSearchContact}
              />

              <div className="border border-border/60 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={handleToggleAllVisible}
                          aria-label={t('common.search')}
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
                      return (
                        <tr key={c.id} className="hover:bg-muted/10">
                          <td className="px-4 py-2">
                            <Checkbox
                              checked={!!selectedRecipients[c.id]}
                              onCheckedChange={() => handleToggleRecipient(c.id)}
                              aria-label={`Select ${getDisplayName(c)}`}
                            />
                          </td>
                          <td className="px-4 py-2 font-medium text-foreground">{getDisplayName(c)}</td>
                          <td className="px-4 py-2 font-mono text-muted-foreground">{phone || '-'}</td>
                          <td className="px-4 py-2 text-muted-foreground">{getPrimaryEmail(c) || '-'}</td>
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

            {/* Action Campaign Panel */}
            <div className="border border-border rounded-xl bg-card p-4 space-y-4 flex flex-col justify-between">
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
                    <div className="max-h-24 overflow-y-auto border border-border/30 rounded p-1.5 bg-background space-y-1">
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
                  className="w-full bg-success hover:bg-success/90 text-success-foreground font-semibold"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('messaging.sendWhatsapp')}
                </Button>
                <Button
                  onClick={() => triggerCompose('sms')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-info hover:bg-info/90 text-info-foreground font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('messaging.sendSms')}
                </Button>
                <Button
                  onClick={() => triggerCompose('email')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {t('messaging.sendEmail')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Message history log table */}
            <div className="lg:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-grow">
                  <SearchBar
                    placeholder={t('messaging.search.placeholder')}
                    value={searchLog}
                    onChange={setSearchLog}
                    className="flex-grow max-w-sm"
                  />

                  {/* Channel Filter Selector */}
                  <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                    {(['all', 'sms', 'whatsapp', 'email'] as const).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        className={`px-2.5 py-1 rounded-md font-bold uppercase transition-all ${
                          channelFilter === ch 
                            ? 'bg-background shadow-sm text-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {filteredLogs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const headers = ["Recipient", "Channel", "Body", "Sent At"];
                        const rows = filteredLogs.map((log) => {
                          const recipient = allContacts.find((c) => c.id === log.contactId);
                          const name = recipient ? getDisplayName(recipient) : `Contact #${log.contactId}`;
                          return [
                            `"${name.replace(/"/g, '""')}"`,
                            log.channel,
                            `"${log.body.replace(/"/g, '""')}"`,
                            log.sentAt,
                          ].join(",");
                        });
                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `message_history_${new Date().toISOString().split("T")[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        notify.success(t('messaging.exportLogs'));
                      }}
                      className="font-semibold text-foreground"
                    >
                      <Download className="w-4 h-4 mr-1.5 text-primary" />
                      {t('common.export')}
                    </Button>
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredLogs.map((log) => {
                        const recipient = allContacts.find((c) => c.id === log.contactId);
                        const name = recipient ? getDisplayName(recipient) : `Contact #${log.contactId}`;
                        return (
                          <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                            <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {name}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                log.channel === 'email'
                                  ? 'bg-warning/10 text-warning border border-warning/20'
                                  : log.channel === 'sms' 
                                  ? 'bg-info/10 text-info border border-info/20' 
                                  : 'bg-success/10 text-success border border-success/20'
                              }`}>
                                {log.channel === 'email' ? <Mail className="w-3 h-3" /> : log.channel === 'sms' ? <MessageSquare className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                {log.channel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground max-w-md truncate" title={log.body}>
                              {log.body}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                              {formatDate(log.sentAt)}
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

            {/* Volume Breakdown Recharts PieChart */}
            <div className="border border-border rounded-xl bg-card p-4 flex flex-col justify-between">
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
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create / Edit Template Form */}
            <div className="border border-border rounded-xl bg-card p-4 space-y-4">
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
                    placeholder="e.g. Absent Notification"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className={FORM_LABEL} htmlFor="tplBody">{t('messaging.messageBody')}</label>
                    <div className="flex items-center gap-1">
                      {['{name}', '{first_name}', '{phone}', '{email}', '{date}'].map((token) => (
                        <button
                          key={token}
                          type="button"
                          onClick={() => insertVariableTag(token)}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="tplBody"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Hello {name}, we missed you today..."
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full font-bold">
                  <Check className="w-4 h-4 mr-1.5" />
                  {editingTemplateId ? t('messaging.updateTemplate') : t('messaging.saveTemplate')}
                </Button>
              </form>
            </div>

            {/* Existing Templates Listing */}
            <div className="md:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-muted-foreground" /> {t('messaging.configuredPresets')}
                  </h4>
                  <p className="text-xs text-muted-foreground">{t('messaging.configuredPresetsDesc')}</p>
                </div>
                <SearchBar
                  placeholder={t('messaging.search.placeholder')}
                  value={searchTemplate}
                  onChange={setSearchTemplate}
                  className="max-w-xs"
                />
              </div>

              <div className="overflow-x-auto border border-border/50 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2.5">{t('messaging.templateLabel')}</th>
                      <th className="px-4 py-2.5">{t('messaging.templateCopy')}</th>
                      <th className="px-4 py-2.5 w-24 text-center">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTemplates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{tpl.label}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-sm truncate" title={tpl.body}>
                          {tpl.body}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tpl.id.startsWith('custom_') ? (
                            <div className="flex items-center justify-center gap-1">
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
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic font-mono uppercase bg-muted/65 px-1.5 py-0.5 rounded border border-border/30">
                              {t('messaging.tagSystem')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTemplates.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-muted-foreground">
                          {t('messaging.noLogs')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </ResponsiveAccordionTabs>

      {/* Shared composer modal */}
      {composerTarget && (
        <MessageComposer
          channel={composerTarget.channel}
          recipients={composerTarget.recipients}
          templates={templates}
          onClose={() => {
            setComposerTarget(null);
            setSelectedRecipients({});
          }}
        />
      )}

      {/* Confirm dialog for deleting custom template */}
      <ConfirmAlertDialog
        open={Boolean(deleteTemplateId)}
        onOpenChange={(open) => { if (!open) setDeleteTemplateId(null); }}
        title={t('messaging.deleteTemplateTitle')}
        description={t('messaging.deleteTemplateDesc')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={confirmDeleteTemplate}
      />

      {/* Confirm dialog for clearing all message logs */}
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

