import React, { useState, useMemo, useEffect } from 'react';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { 
  MessageSquare, MessageCircle, Send, Search, 
  Trash2, User, Clock, Plus, Tag, Filter, Check, Mail, BarChart2
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
import { Checkbox } from '@/components/ui/checkbox';
import { getCollection, saveCollection } from '@/lib/db';
import { useContactsCollection } from '@/tenant/features/contacts/hooks/useContacts';
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, formatDate, type Message } from '@mms/shared';
import MessageComposer, { type MessagingRecipient, type MessageTemplate } from '@/components/ui/MessageComposer';
import { notify } from '@/lib/notify';
import { FORM_LABEL, FORM_INPUT, FORM_TEXTAREA } from '@/components/ui/formStyles';

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
  
  // Advanced filters
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'unspecified'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');
  
  // Custom templates form state
  const [templateLabel, setTemplateLabel] = useState('');
  const [templateBody, setTemplateBody] = useState('');

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

  // Handle template creation
  const handleCreateTemplate = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!user) return;
    if (!templateLabel.trim() || !templateBody.trim()) {
      notify.error('Please specify both template label and body');
      return;
    }
    const dbKey = `messages_templates_u:${user.id}`;
    const custom = getCollection<MessageTemplate>(dbKey) || [];
    const newTpl: MessageTemplate = {
      id: `custom_${Date.now()}`,
      label: templateLabel.trim(),
      body: templateBody.trim(),
    };
    saveCollection(dbKey, [...custom, newTpl]);
    setTemplateLabel('');
    setTemplateBody('');
    notify.success('Custom message template saved successfully');
  };

  // Handle template deletion
  const handleDeleteTemplate = (id: string): void => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this template?')) {
      const dbKey = `messages_templates_u:${user.id}`;
      const custom = getCollection<MessageTemplate>(dbKey) || [];
      const updated = custom.filter((tpl) => tpl.id !== id);
      saveCollection(dbKey, updated);
      notify.success('Template deleted successfully');
    }
  };

  // Load sent messages history from DB
  const messageLogs = useMemo(() => {
    const _tick = localTick; // re-evaluate on local database update
    if (!user) return [];
    const dbKey = `messages_u:${user.id}`;
    return getCollection<Message>(dbKey) || [];
  }, [user, localTick]);

  // Handle clearing log history
  const handleClearLogs = (): void => {
    if (!user) return;
    if (window.confirm('Are you sure you want to clear all message logs?')) {
      saveCollection(`messages_u:${user.id}`, []);
      notify.success('Message logs cleared successfully');
    }
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
              notify.info('Please select recipients from the checklist below to compose a campaign.');
            }
          }}
        >
          New Campaign
        </ActionButton>
      }
      metricsStrip={
        <ModuleCommandMetricsGrid
          items={[
            { icon: Send, label: t('messaging.stats.total'), value: stats.total, accent: 'primary' },
            { icon: MessageSquare, label: t('messaging.stats.sms'), value: stats.sms, accent: 'info' },
            { icon: MessageCircle, label: t('messaging.stats.whatsapp'), value: stats.wa, accent: 'success' },
            { icon: Mail, label: 'Emails Dispatched', value: stats.email, accent: 'warning' },
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

              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipients by name..."
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="border border-border/60 rounded-lg overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2 w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={handleToggleAllVisible}
                          aria-label="Select all visible"
                        />
                      </th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Phone Number</th>
                      <th className="px-4 py-2">Email Address</th>
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
                          No active contacts with valid phone numbers or emails match your filters.
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
                    <span className="text-muted-foreground">Contacts Checked:</span>
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
                  Send WhatsApp Campaign
                </Button>
                <Button
                  onClick={() => triggerCompose('sms')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-info hover:bg-info/90 text-info-foreground font-semibold"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send SMS Campaign
                </Button>
                <Button
                  onClick={() => triggerCompose('email')}
                  disabled={currentSelectedList.length === 0}
                  className="w-full bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email Campaign
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
                  <div className="relative flex-grow max-w-sm">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('messaging.search.placeholder')}
                      value={searchLog}
                      onChange={(e) => setSearchLog(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>

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

                {messageLogs.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearLogs}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    {t('messaging.clearLogs')}
                  </Button>
                )}
              </div>

              {filteredLogs.length > 0 ? (
                <div className="overflow-x-auto border border-border/50 rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Recipient</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Message Body</th>
                        <th className="px-4 py-3">Date Sent</th>
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
                  <p className="text-sm font-medium">No sent message records found</p>
                </div>
              )}
            </div>

            {/* Volume Breakdown Recharts PieChart */}
            <div className="border border-border rounded-xl bg-card p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-primary" /> Volume Breakdown
                </h4>
                <p className="text-xs text-muted-foreground">Campaign distribution by communications channel.</p>
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
                  <p className="text-xs font-semibold">No dispatches to chart</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Template Form */}
            <div className="border border-border rounded-xl bg-card p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" /> {t('messaging.createPreset')}
                </h4>
                <p className="text-xs text-muted-foreground">{t('messaging.createPresetDesc', { name: '{name}' })}</p>
              </div>

              <form onSubmit={handleCreateTemplate} className="space-y-3">
                <div>
                  <label className={FORM_LABEL} htmlFor="tplLabel">Template Label / Title</label>
                  <Input
                    id="tplLabel"
                    value={templateLabel}
                    onChange={(e) => setTemplateLabel(e.target.value)}
                    placeholder="e.g., Absent Notification"
                    className={FORM_INPUT}
                    required
                  />
                </div>

                <div>
                  <label className={FORM_LABEL} htmlFor="tplBody">{t('contacts.messageBody')}</label>
                  <textarea
                    id="tplBody"
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Hello {name}, we missed you today at the session..."
                    className={FORM_TEXTAREA}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full font-bold">
                  <Check className="w-4 h-4 mr-1.5" />
                  {t('messaging.saveTemplate')}
                </Button>
              </form>
            </div>

            {/* Existing Templates Listing */}
            <div className="md:col-span-2 border border-border rounded-xl bg-card p-4 space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-muted-foreground" /> {t('messaging.configuredPresets')}
                </h4>
                <p className="text-xs text-muted-foreground">{t('messaging.configuredPresetsDesc')}</p>
              </div>

              <div className="overflow-x-auto border border-border/50 rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <tr className="border-b border-border/60">
                      <th className="px-4 py-2.5">Template Label</th>
                      <th className="px-4 py-2.5">Message Copy</th>
                      <th className="px-4 py-2.5 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {templates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{tpl.label}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-sm truncate" title={tpl.body}>
                          {tpl.body}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tpl.id.startsWith('custom_') ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60 italic font-mono uppercase bg-muted/65 px-1.5 py-0.5 rounded border border-border/30">system</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
    </ModulePageShell>
  );
}
