import React, { useState, useEffect, useMemo, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit2, MessageCircle, MessageSquare, Phone, Mail,
  ExternalLink, Calendar, User, Clock, Tag,
  Send, LucideIcon, MapPin, Copy, Check,
  LayoutDashboard, History, Users as UsersIcon, FileText, BrainCircuit, ShieldCheck, Search, Zap,
  Loader2, Trash2
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { Contact, ContactActivity, canViewContactField, CONTACTS_MODULE_CONTRACT } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, calcAge, getInitials } from "@mms/shared";
import { formatDate, todayISO } from "@mms/shared";
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { ACTIVITY_TYPE_I18N } from '@/lib/contacts/contactI18n';
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { apiJson } from "@/lib/apiClient";
import { getCollection } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { Input } from "@/components/ui/input";
import { uploadAttachmentFile } from "@/lib/attachmentUpload";
import { notify } from "@/lib/notify";
import ContactAvatar from "@/tenant/features/contacts/components/ContactAvatar";

const ICON_MAP: Record<string, LucideIcon | typeof Tag> = {
  // tab keys
  overview: LayoutDashboard,
  timeline: History,
  network: UsersIcon,
  files: FileText,
  // field keys
  gender: User,
  dob: Calendar,
  // activity types
  note: FileText,
  stage_change: Zap,
  system: ShieldCheck,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  call: Phone,
};

const DETAIL_STYLES = {
  whatsappActive: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  whatsappDisabled: "opacity-40 cursor-not-allowed bg-muted/50 text-muted-foreground",
  syedBadge: "bg-success/10 text-success border border-success/20 font-bold",
  smsAction: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
  callAction: "bg-info/10 text-info border border-info/20 hover:bg-info/20",
  emailAction: "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20",
  emergencyBadge: "bg-destructive/10 text-destructive border-destructive/30",
  networkHeader: "bg-success/10 border-success/30",
  networkIcon: "bg-success/10 text-success",
  networkTitle: "text-success",
  networkSubtitle: "text-success/80",
  networkItemCard: "border-border hover:border-success/30 hover:bg-success/5",
  networkItemIcon: "bg-success/10 text-success border border-success/20",
  networkItemAction: "hover:bg-muted text-muted-foreground hover:text-foreground",
  networkRelType: "text-success",
  liveIntelIndicator: "bg-success",
  liveIntelText: "text-success",
} as const;

interface ContactDetailDrawerProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
  onEmail: (contacts: Contact[]) => void;
  allContacts?: Contact[];
  onUpdateContact?: (contact: Contact) => Promise<void>;
}

/** Helper component for rendering a card with grouped contact fields */
interface FieldGroupCardProps {
  group: string;
  fields: { key: string; label: string; type: string }[];
  formatValue: (field: { key: string; type: string }) => string | null;
}

function FieldGroupCard({ group, fields, formatValue }: FieldGroupCardProps): React.JSX.Element | null {
  const validFields = fields.map((f) => ({ field: f, val: formatValue(f) })).filter((item) => Boolean(item.val));
  if (validFields.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{group}</h4>
      <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
        {validFields.map(({ field, val }) => {
          const Icon = ICON_MAP[field.key] || Tag;
          return (
            <div key={field.key} className="flex items-center gap-3 p-3 group/row">
              <div className="p-2 rounded-lg bg-muted/80 group-hover/row:bg-primary/10 transition-colors">
                <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">
                  {field.label}
                </span>
                <span className="text-sm font-semibold text-foreground truncate block">{val}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ContactDetailDrawer component for displaying a detailed slide-out panel for a contact.
 *
 * @returns React.JSX.Element
 */
export default function ContactDetailDrawer({
  contact: initialContact,
  onClose,
  onEdit,
  onWhatsApp,
  onSms,
  onEmail,
  allContacts = [],
  onUpdateContact,
}: ContactDetailDrawerProps): React.JSX.Element {
  const { enabledTabIds, isTabFieldEnabled, fieldConfig, fields, phoneLabels, emailLabels, addressLabels, socialPlatforms } = useContactConfig();
  const { user } = useAuth();
  const { role } = usePermissions();
  const viewerRole = role ?? '';
  const { t } = useTranslation();
  useBodyScrollLock();
  const noteInputId = useId();
  const [c, setC] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userMessages, setUserMessages] = useState<{
    id: string;
    userId: string;
    contactId: string | number;
    channel: string;
    body: string;
    sentAt: string;
  }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    notify.success(t('contacts.table.copied'));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setIsUploading(true);
    try {
      const newAttachments = [...(c.attachments || [])];
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        const res = await uploadAttachmentFile(file);
        newAttachments.push({
          id: crypto.randomUUID(),
          name: res.name,
          type: res.type,
          size: res.size,
          url: res.url,
          date: new Date().toISOString(),
        });
      }
      const updatedContact = {
        ...c,
        attachments: newAttachments,
      };
      const prev = c;
      setC(updatedContact);
      if (onUpdateContact) {
        await onUpdateContact(updatedContact)
          .then(() => notify.success(t("contacts.detail.uploadSuccess")))
          .catch(() => {
            setC(prev);
            notify.error(t("contacts.detail.uploadFailed"));
          });
      } else {
        notify.success(t("contacts.detail.uploadSuccess"));
      }
    } catch {
      notify.error(t("contacts.detail.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  useEffect(() => {
    if (!user?.id) {
      setUserMessages([]);
      return;
    }
    const dbKey = `messages_u:${user.id}`;
    const load = () => {
      setUserMessages(
        (getCollection(dbKey) as typeof userMessages) ?? []
      );
    };
    load();
    window.addEventListener("local-database-update", load);
    return () => window.removeEventListener("local-database-update", load);
  }, [user?.id]);

  const detailTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.detailTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tab) => tab.enabled && (["overview", "timeline", "network", "files"].includes(tab.key) || enabledTabIds.has(tab.key)));

    return sorted.map((tab) => ({
      key: tab.key,
      label: tab.label,
      icon: ICON_MAP[tab.icon || tab.key] || LayoutDashboard,
    }));
  }, [fieldConfig.detailTabs, enabledTabIds]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return detailTabs[0]?.key || "";
  });

  const heroFieldSet = useMemo(
    () => new Set<string>(CONTACTS_MODULE_CONTRACT.heroFieldKeys),
    [],
  );

  useEffect(() => {
    setC(initialContact);
    setActiveTab(detailTabs[0]?.key || "");
  }, [initialContact, detailTabs]);

  const age = calcAge(c.dob as string | null);

  const allFields = useMemo(() => {
    return Object.entries(fields).flatMap(([tabId, tabFields]) =>
      (tabFields || [])
        .filter((field) => canViewContactField(viewerRole, field))
        .map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          tab: tabId,
          group: field.group || t('contacts.detail.extendedProfiles'),
          description: field.description || "",
        }))
    );
  }, [fields, t, viewerRole]);

  const visibleCollectionFields = useMemo(
    () => ({
      phones: (fields.phones || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      emails: (fields.emails || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      addresses: (fields.addresses || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      socials: (fields.socials || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
      emergency: (fields.emergency || []).filter((field) => field.enabled && canViewContactField(viewerRole, field)),
    }),
    [fields, viewerRole],
  );

  const combinedActivities = useMemo(() => {
    const VALID_ACTIVITY_TYPES = new Set<ContactActivity["type"]>(["note", "stage_change", "whatsapp", "email", "system", "task", "call"]);
    const noteActs = c.activities || [];
    const messageActs: ContactActivity[] = userMessages
      .filter((userMessage) => String(userMessage.contactId) === String(c.id))
      .map((userMessage) => ({
        id: userMessage.id,
        type: (VALID_ACTIVITY_TYPES.has(userMessage.channel as ContactActivity["type"])
          ? userMessage.channel
          : "system") as ContactActivity["type"],
        content: userMessage.body,
        date: userMessage.sentAt,
        by: user?.name || t('contacts.detail.systemUser'),
      }));
    const all = [...noteActs, ...messageActs];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [c.activities, userMessages, c.id, user?.name, t]);

  const fieldsToRender = allFields.filter(
    (field) =>
      !heroFieldSet.has(field.key) &&
      isTabFieldEnabled(field.tab, field.key) &&
      c[field.key] !== undefined && c[field.key] !== null && c[field.key] !== "" && c[field.key] !== false &&
      !(Array.isArray(c[field.key]) && (c[field.key] as unknown[]).length === 0)
  );

  const grouped = fieldsToRender.reduce<Record<string, typeof fieldsToRender>>((acc, field) => {
    const group = field.group || t('contacts.detail.otherGroup');
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  const formatFieldValue = (field: { key: string; type: string }): string | null => {
    const fieldValue = c[field.key];
    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
    if (Array.isArray(fieldValue)) return fieldValue.length ? fieldValue.join(", ") : null;
    if (field.key === "dob") {
      try {
        const yrsLabel = t('contacts.detail.yearsOld');
        return `${formatDate(fieldValue as string, true)}${age ? ` (${age} ${yrsLabel})` : ""}`;
      } catch {
        return String(fieldValue);
      }
    }
    return String(fieldValue);
  };

  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(c) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(c) : null;

  const handleAddNote = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const newActivity: ContactActivity = {
      id: `act-${crypto.randomUUID()}`,
      type: "note",
      content: trimmed,
      date: todayISO(),
      by: user?.name || t('contacts.detail.systemUser')
    };

    const prev = c;
    const updatedContact = { ...c, activities: [newActivity, ...(c.activities || [])] };

    // Optimistic update
    setC(updatedContact);
    setNoteText("");

    if (onUpdateContact) {
      onUpdateContact(updatedContact).catch(() => {
        setC(prev);
        setNoteText(trimmed);
        notify.error(t('contacts.detail.noteSaveFailed'));
      });
    }
  };

  const handleNavigateToContact = (targetId: string | number): void => {
    const target = allContacts.find((contact) => String(contact.id) === String(targetId));
    if (target) {
      setC(target);
      return;
    }
    void apiJson<{ contact: Contact }>(`${CONTACTS_MODULE_CONTRACT.restBasePath}/${targetId}`)
      .then((body) => setC(body.contact))
      .catch(() => undefined);
  };

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={t('contacts.detail.title')}
      ariaLabel={t('contacts.detail.title')}
      headerActions={
        <Button
          variant="outline"
          onClick={() => onEdit(c)}
          aria-label={t('contacts.detail.editProfile')}
          className="h-8 w-8 p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
          title={t('contacts.detail.editProfile')}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      }
      headerExtra={
        <div className="flex border-b border-border py-1 overflow-x-auto w-full">
          <SubTabBar
            tabs={detailTabs}
            value={activeTab}
            onChange={setActiveTab}
            panelIdPrefix="contact-detail-drawer"
            className="w-full"
          />
        </div>
      }
      footer={
        <>
          <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            <Clock className="w-3 h-3" />
            {(c.updatedAt || c.createdAt) && (
              <span>{t('contacts.detail.updatedLabel')} {formatDate((c.updatedAt || c.createdAt) as string)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${DETAIL_STYLES.liveIntelIndicator}`} />
            <span className={`text-[9px] font-bold uppercase ${DETAIL_STYLES.liveIntelText}`}>{t('contacts.detail.liveIntel')}</span>
          </div>
        </>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {activeTab === "overview" && (
            <>
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
                <ContactAvatar contact={c} className="w-16 h-16 rounded-2xl text-2xl shadow-xs" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-foreground truncate leading-tight">{getDisplayName(c)}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                    {c.isSyed && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider ${DETAIL_STYLES.syedBadge}`}>
                        {t('contacts.table.yesSyed')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Intelligence Brief */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('contacts.detail.aiIntelligence')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic relative">
                  {c.aiSummary || t('contacts.detail.defaultAiSummary')}
                </div>
              </div>

              {/* Quick Communication Actions Bar */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {enabledTabIds.has("phones") && (
                  <Button
                    variant="ghost"
                    disabled={!hasWhatsApp(c)}
                    onClick={() => onWhatsApp([c])}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border h-auto font-normal transition-all shadow-none ${
                      hasWhatsApp(c) ? DETAIL_STYLES.whatsappActive : DETAIL_STYLES.whatsappDisabled
                    }`}
                    type="button"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('contacts.whatsapp')}</span>
                  </Button>
                )}
                {primaryPhone && (
                  <Button
                    variant="ghost"
                    onClick={() => onSms([c])}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border h-auto font-normal transition-all shadow-none ${DETAIL_STYLES.smsAction}`}
                    type="button"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('contacts.sms')}</span>
                  </Button>
                )}
                {primaryPhone && (
                  <a
                    href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
                    aria-label={`${t('contacts.detail.call')} ${primaryPhone}`}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${DETAIL_STYLES.callAction}`}
                  >
                    <Phone className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('contacts.detail.call')}</span>
                  </a>
                )}
                {primaryEmail && (
                  <Button
                    variant="ghost"
                    onClick={() => onEmail([c])}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border h-auto font-normal transition-all shadow-none ${DETAIL_STYLES.emailAction}`}
                    type="button"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{t('contacts.detail.emailAction')}</span>
                  </Button>
                )}
              </div>

              {/* Grouped Basic Fields (DRY component) */}
              <div className="space-y-4">
                {Object.entries(grouped)
                  .filter(([, fieldsList]) =>
                    fieldsList.some((field) => field.tab === "basic" || !["timeline", "network", "files"].includes(field.tab))
                  )
                  .map(([groupName, fieldsList]) => (
                    <FieldGroupCard
                      key={groupName}
                      group={groupName}
                      fields={fieldsList}
                      formatValue={formatFieldValue}
                    />
                  ))}

                {/* Collection: Phone Numbers */}
                {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && c.phones && c.phones.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">
                      {t('contacts.form.phonesLabel')}
                    </h4>
                    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                      {c.phones.map((phone, phoneIndex) => {
                        const rawPhone = String(phone.number || "");
                        const copyKey = `phone-${phoneIndex}`;
                        return (
                          <div key={phoneIndex} className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                  {phone.label || phoneLabels[0] || t('contacts.detail.mobileLabel')}
                                </span>
                              </div>
                              <span className="font-semibold text-sm text-foreground block truncate">{rawPhone}</span>
                            </div>
                            {rawPhone && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Copy phone"
                                  onClick={() => copyToClipboard(rawPhone, copyKey)}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  {copiedKey === copyKey ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                                <a
                                  href={`tel:${rawPhone.replace(/[^\d+]/g, "")}`}
                                  aria-label={`Call ${rawPhone}`}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-info hover:bg-info/10 transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collection: Emails */}
                {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && c.emails && c.emails.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">
                      {t('contacts.form.emailsLabel')}
                    </h4>
                    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                      {c.emails.map((email, emailIndex) => {
                        const rawEmail = String(email.address || "");
                        const copyKey = `email-${emailIndex}`;
                        return (
                          <div key={emailIndex} className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                  {email.label || emailLabels[0] || t('contacts.detail.personalLabel')}
                                </span>
                              </div>
                              <span className="font-semibold text-sm text-foreground block truncate">{rawEmail}</span>
                            </div>
                            {rawEmail && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Copy email"
                                  onClick={() => copyToClipboard(rawEmail, copyKey)}
                                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  {copiedKey === copyKey ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                                <a
                                  href={`mailto:${rawEmail}`}
                                  aria-label={`Email ${rawEmail}`}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center text-secondary hover:bg-secondary/10 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collection: Addresses */}
                {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && c.addresses && c.addresses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">
                      {t('contacts.detail.addresses')}
                    </h4>
                    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                      {c.addresses.map((address, addressIndex) => {
                        const fullAddr = [address.line1, address.city, address.state, address.country]
                          .filter(Boolean)
                          .join(", ");
                        return (
                          <div key={addressIndex} className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                  {address.label || addressLabels[0] || t('contacts.detail.homeLabel')}
                                </span>
                              </div>
                              <span className="font-semibold text-xs text-foreground block leading-relaxed">{fullAddr || "—"}</span>
                            </div>
                            {fullAddr && (
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(fullAddr)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open address in maps`}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collection: Socials */}
                {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && c.socials && c.socials.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">
                      {t('contacts.detail.socials')}
                    </h4>
                    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                      {c.socials.map((social, socialIndex) => {
                        const handle = String(social.url || "");
                        const url = handle.startsWith("http") ? handle : `https://${handle}`;
                        return (
                          <div key={socialIndex} className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase inline-block mb-1">
                                {social.platform || socialPlatforms[0] || "Social"}
                              </span>
                              <span className="font-semibold text-xs text-foreground block truncate">{handle || "—"}</span>
                            </div>
                            {handle && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Visit social profile`}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Collection: Emergency Contacts */}
                {enabledTabIds.has("emergency") && visibleCollectionFields.emergency.length > 0 && c.emergencyContacts && c.emergencyContacts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">
                      {t('contacts.detail.emergency')}
                    </h4>
                    <div className="relative overflow-hidden bg-card/60 backdrop-blur-xs rounded-2xl border border-border/80 shadow-xs hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                      {c.emergencyContacts.map((emergencyContact, emergencyContactIndex) => {
                        const target = allContacts.find((contact) => String(contact.id) === String(emergencyContact.contactId));
                        return (
                          <div key={emergencyContactIndex} className="p-3 border-b border-border/50 last:border-b-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${DETAIL_STYLES.emergencyBadge}`}>
                                {t('contacts.detail.emergencyContact')}
                              </span>
                            </div>
                            <div className="text-xs space-y-1">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase block">{t('contacts.detail.relationships')}</span>
                              {target ? (
                                <Button
                                  type="button"
                                  variant="link"
                                  onClick={() => handleNavigateToContact(target.id)}
                                  className="font-semibold text-primary hover:underline text-start h-auto p-0 shadow-none justify-start text-xs"
                                >
                                  {target.name}
                                </Button>
                              ) : (
                                <span className="font-semibold text-foreground">{String(emergencyContact.contactId || "")}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-5">
              <div className="relative">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <Input
                    id={noteInputId}
                    name="contact-note"
                    type="text"
                    placeholder={t('contacts.detail.logEventOrNote')}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl"
                  />
                  <Button
                    type="submit"
                    aria-label={t('contacts.detail.logEventOrNoteSubmit')}
                    className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-none"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              <div className="space-y-6 relative ps-3">
                <div className="absolute inset-inline-start-[3px] top-0 bottom-0 w-0.5 bg-border/50" />
                {(!combinedActivities || combinedActivities.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                    <History className="w-12 h-12 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t('contacts.detail.quietTimeline')}</p>
                  </div>
                ) : (
                  combinedActivities.map((act, idx) => {
                    const Icon = ICON_MAP[act.type] || History;
                    return (
                      <motion.div
                        key={act.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.03, 0.3) }}
                        className="relative ps-6 group"
                      >
                        <div
                          className="absolute inset-inline-start-0 top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 group-hover:border-primary transition-colors"
                          style={{ insetInlineStart: '-15.5px' }}
                        >
                          <Icon className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-xs group-hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              {ACTIVITY_TYPE_I18N[act.type] ? t(ACTIVITY_TYPE_I18N[act.type]) : act.type}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground/60">{formatDate(act.date)}</span>
                          </div>
                          <p className="text-xs text-foreground font-medium leading-relaxed">{act.content}</p>
                          {act.by && <span className="block mt-2 text-[9px] font-bold text-primary italic">— {act.by}</span>}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "network" && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${DETAIL_STYLES.networkHeader}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${DETAIL_STYLES.networkIcon}`}>
                  <UsersIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold leading-none ${DETAIL_STYLES.networkTitle}`}>{c.relationships?.length || 0} {t('contacts.detail.relationships')}</h4>
                  <p className={`text-[10px] font-medium mt-1 uppercase tracking-tight ${DETAIL_STYLES.networkSubtitle}`}>{t('contacts.detail.activeSocialGraph')}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(!c.relationships || c.relationships.length === 0) ? (
                  <div className="text-center py-20">
                    <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/20" />
                    <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{t('contacts.detail.noConnectionsMapped')}</p>
                  </div>
                ) : (
                  c.relationships.map((relationship, relationshipIndex) => {
                    const target = allContacts.find((contact) => String(contact.id) === String(relationship.contactId));
                    return (
                      <div key={relationshipIndex} className={`group flex items-center justify-between gap-3 p-4 rounded-2xl border bg-card transition-all ${DETAIL_STYLES.networkItemCard}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${DETAIL_STYLES.networkItemIcon}`}>
                            {target ? getInitials(target.name) : "?"}
                          </div>
                          <div className="min-w-0">
                            <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 block ${DETAIL_STYLES.networkRelType}`}>{relationship.relationship}</span>
                            <h5 className="text-sm font-bold text-foreground truncate">{target ? target.name : `${t('contacts.table.contactIdPrefix')}${relationship.contactId}`}</h5>
                          </div>
                        </div>
                        {target && (
                          <Button
                            variant="ghost"
                            aria-label={t('contacts.detail.viewContact', { name: target.name })}
                            onClick={() => handleNavigateToContact(relationship.contactId)}
                            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all shadow-none ${DETAIL_STYLES.networkItemAction}`}
                            type="button"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-3 transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {isUploading ? t('contacts.detail.uploading') : t('contacts.detail.cloudStorageRepository')}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                    {t('contacts.detail.dragDropDocuments')}
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                />
                <Button
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-6 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-none"
                  type="button"
                >
                  {t('contacts.detail.browseFiles')}
                </Button>
              </div>

              <div className="space-y-3">
                {(!c.attachments || c.attachments.length === 0) ? (
                  <div className="py-10 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('contacts.detail.repositoryEmpty')}</p>
                  </div>
                ) : (
                  c.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-foreground truncate">{file.name}</h5>
                          <p className="text-[9px] text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} {t('contacts.detail.kbLabel')} · {formatDate(file.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={file.url}
                          download={file.name}
                          aria-label={t('contacts.detail.downloadFile', { name: file.name })}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        {onUpdateContact && (
                          <Button
                            variant="ghost"
                            aria-label={t('contacts.detail.deleteFile', { name: file.name })}
                            onClick={() => {
                              const updatedContact = {
                                ...c,
                                attachments: (c.attachments || []).filter((f) => f.id !== file.id)
                              };
                              const prev = c;
                              setC(updatedContact);
                              onUpdateContact(updatedContact)
                                .then(() => notify.success(t("contacts.detail.deleteSuccess")))
                                .catch(() => setC(prev));
                            }}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shadow-none"
                            type="button"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Dynamic Custom Tabs (DRY FieldGroupCard component) */}
          {!["overview", "timeline", "network", "files"].includes(activeTab) && (
            <div className="space-y-4">
              {Object.entries(grouped)
                .filter(([, fieldsList]) => fieldsList.some((field) => field.tab === activeTab))
                .map(([groupName, fieldsList]) => (
                  <FieldGroupCard
                    key={groupName}
                    group={groupName}
                    fields={fieldsList.filter((field) => field.tab === activeTab)}
                    formatValue={formatFieldValue}
                  />
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </DetailDrawerShell>
  );
}
