import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit2, MessageCircle, MessageSquare, Phone, Mail,
  ExternalLink, Calendar, User, Clock, Tag,
  Send, LucideIcon,
  LayoutDashboard, History, Users as UsersIcon, FileText, BrainCircuit, ShieldCheck, Search, Zap
} from "lucide-react";
import { Contact, ContactActivity, canViewContactField, CONTACTS_MODULE_CONTRACT } from "@mms/shared";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, calcAge } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePermissions } from '@/tenant/hooks/usePermissions';
import { useTranslation } from '@/hooks/useTranslation';
import { ACTIVITY_TYPE_I18N } from '@/lib/contacts/contactI18n';
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { apiJson } from "@/lib/apiClient";
import { getCollection } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICON_MAP: Record<string, LucideIcon | typeof Tag> = {
  overview: LayoutDashboard,
  timeline: History,
  network: UsersIcon,
  files: FileText,
  gender: User,
  dob: Calendar,
  LayoutDashboard,
  History,
  Users: UsersIcon,
  FileText,
  User,
  Calendar,
  Tag,
  Zap,
  ShieldCheck,
  note: FileText,
  stage_change: Zap,
  system: ShieldCheck,
  sms: MessageSquare,
  whatsapp: MessageCircle,
};

import ContactAvatar from "@/tenant/features/contacts/components/ContactAvatar";

const DETAIL_STYLES = {
  whatsappActive: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  whatsappDisabled: "opacity-40 cursor-not-allowed bg-muted/50 text-muted-foreground",
  syedBadge: "bg-success/10 text-success border border-success/20",
  starActive: "text-secondary fill-secondary",
  starInactive: "text-muted-foreground/30 fill-transparent",
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
  onUpdateContact?: (contact: Contact) => void;
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
  const [c, setC] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState<string>("");
  const [userMessages, setUserMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setUserMessages([]);
      return;
    }
    const dbKey = `messages_u:${user.id}`;
    const load = () => {
      setUserMessages(getCollection(dbKey));
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
  }, [initialContact]);



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
    const noteActs = c.activities || [];
    const messageActs: ContactActivity[] = userMessages
      .filter((userMessage) => String(userMessage.contactId) === String(c.id))
      .map((userMessage) => ({
        id: userMessage.id,
        type: userMessage.channel,
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

  const formatFieldValue = (field: { key: string, type: string }): string | null => {
    const fieldValue = c[field.key];
    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
    if (Array.isArray(fieldValue)) return fieldValue.length ? fieldValue.join(", ") : null;
    if (field.key === "dob") {
      try {
        const yrsLabel = t('contacts.detail.yearsOld');
        return `${formatDate(fieldValue as string, true)}${age ? ` (${age} ${yrsLabel})` : ""}`;
      } catch (error) {
        console.error("Failed parsing DOB value:", fieldValue, error);
        return String(fieldValue);
      }
    }
    return String(fieldValue);
  };

  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(c) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(c) : null;

  const handleAddNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteText.trim()) return;

    const newActivity: ContactActivity = {
      id: `act-${Date.now()}`,
      type: "note",
      content: noteText.trim(),
      date: new Date().toISOString().slice(0, 10),
      by: user?.name || t('contacts.detail.systemUser')
    };

    const updatedContact = {
      ...c,
      activities: [newActivity, ...(c.activities || [])]
    };

    setC(updatedContact);
    setNoteText("");

    if (onUpdateContact) {
      onUpdateContact(updatedContact);
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
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm h-full bg-card/90 border-l border-border/80 shadow-2xl flex flex-col z-10 backdrop-blur-xl"
        aria-label={t('contacts.detail.title')}
      >
        
        <div className="sticky top-0 bg-card/75 backdrop-blur-md z-10 px-5 pt-4 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-foreground leading-tight">{t('contacts.detail.title')}</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onEdit(c)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none"
                title={t('contacts.detail.editProfile')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shadow-none"
                aria-label={t('contacts.detail.close')}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          
          <div className="flex gap-1">
            {detailTabs.map((t: { key: string; label: string; icon: LucideIcon | typeof Tag }) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <Button
                  key={t.key}
                  variant="ghost"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex flex-col items-center min-h-[44px] justify-center gap-1.5 py-2 border-b-2 rounded-none transition-all shadow-none font-bold ${
                    isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
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
                  
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <ContactAvatar contact={c} className="w-16 h-16 rounded-2xl text-2xl" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate leading-tight">{getDisplayName(c)}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">

                        {c.isSyed && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${DETAIL_STYLES.syedBadge}`}>
                            {t('contacts.table.yesSyed')}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-primary">
                       <BrainCircuit className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{t('contacts.detail.aiIntelligence')}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic">
                      {c.aiSummary || t('contacts.detail.defaultAiSummary')}
                    </div>
                  </div>

                  
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

                  
                  <div className="space-y-4">
                    {Object.entries(grouped).filter(([, fields]) => fields.some((field) => field.tab === "basic" || !["timeline", "network", "files"].includes(field.tab))).map(([group, fields]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{group}</h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {fields.map((field) => {
                             const displayValue = formatFieldValue(field);
                             if (!displayValue) return null;
                             const Icon = ICON_MAP[field.key] || Tag;
                             return (
                               <div key={field.key} className="flex items-center gap-3 p-3 group/row">
                                 <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                   <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{field.label}</span>
                                   <span className="text-sm font-semibold text-foreground truncate">{displayValue}</span>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    ))}

                    
                    {enabledTabIds.has("phones") && visibleCollectionFields.phones.length > 0 && c.phones && c.phones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {t('contacts.form.phonesLabel')}
                        </h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {c.phones.map((phone, phoneIndex) => {
                            const tabFields = visibleCollectionFields.phones.filter((field) => field.key !== "label");
                            return (
                              <div key={phoneIndex} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {phone.label || phoneLabels[0] || t('contacts.detail.mobileLabel')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map((field) => {
                                    const fieldValue = (phone as unknown as Record<string, unknown>)[field.key];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
                                    const displayValue = typeof fieldValue === "boolean" ? (fieldValue ? t('common.yes') : t('common.no')) : String(fieldValue);
                                    return (
                                      <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                        <span className="font-semibold text-foreground">{displayValue}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {enabledTabIds.has("emails") && visibleCollectionFields.emails.length > 0 && c.emails && c.emails.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {t('contacts.form.emailsLabel')}
                        </h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {c.emails.map((email, emailIndex) => {
                            const tabFields = visibleCollectionFields.emails.filter((field) => field.key !== "label");
                            return (
                              <div key={emailIndex} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {email.label || emailLabels[0] || t('contacts.detail.personalLabel')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map((field) => {
                                    const fieldValue = (email as unknown as Record<string, unknown>)[field.key];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
                                    return (
                                      <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                        <span className="font-semibold text-foreground">{String(fieldValue)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {enabledTabIds.has("addresses") && visibleCollectionFields.addresses.length > 0 && c.addresses && c.addresses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {t('contacts.detail.addresses')}
                        </h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {c.addresses.map((address, addressIndex) => {
                            const tabFields = visibleCollectionFields.addresses.filter((field) => field.key !== "label");
                            return (
                              <div key={addressIndex} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {address.label || addressLabels[0] || t('contacts.detail.homeLabel')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map((field) => {
                                    const fieldValue = (address as unknown as Record<string, unknown>)[field.key];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
                                    return (
                                      <div key={field.key} className={field.type === "textarea" || field.key === "line1" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                        <span className="font-semibold text-foreground">{String(fieldValue)}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {enabledTabIds.has("socials") && visibleCollectionFields.socials.length > 0 && c.socials && c.socials.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {t('contacts.detail.socials')}
                        </h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {c.socials.map((social, socialIndex) => {
                            const tabFields = visibleCollectionFields.socials.filter((field) => field.key !== "platform");
                            return (
                              <div key={socialIndex} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {social.platform || socialPlatforms[0] || "—"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map((field) => {
                                    const fieldValue = (social as unknown as Record<string, unknown>)[field.key];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
                                    return (
                                      <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                        {field.type === "url" ? (
                                          <a
                                            href={String(fieldValue).startsWith("http") ? String(fieldValue) : `https://${fieldValue}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-primary hover:underline inline-flex items-center gap-1 truncate"
                                          >
                                            {String(fieldValue)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                          </a>
                                        ) : (
                                          <span className="font-semibold text-foreground">{String(fieldValue)}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {enabledTabIds.has("emergency") && visibleCollectionFields.emergency.length > 0 && c.emergencyContacts && c.emergencyContacts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {t('contacts.detail.emergency')}
                        </h4>
                        <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                          {c.emergencyContacts.map((emergencyContact, emergencyContactIndex) => {
                            const tabFields = visibleCollectionFields.emergency;
                            const target = allContacts.find((contact) => String(contact.id) === String(emergencyContact.contactId));
                            return (
                              <div key={emergencyContactIndex} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${DETAIL_STYLES.emergencyBadge}`}>
                                    {t('contacts.detail.emergencyContact')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {tabFields.map((field) => {
                                    if (field.key === "contactId") {
                                      return (
                                        <div key={field.key} className="col-span-2">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                          {target ? (
                                            <Button
                                              type="button"
                                              variant="link"
                                              onClick={() => handleNavigateToContact(target.id)}
                                              className="font-semibold text-primary hover:underline text-left h-auto p-0 shadow-none justify-start"
                                            >
                                              {target.name}
                                            </Button>
                                          ) : (
                                            <span className="font-semibold text-foreground">{String(emergencyContact.contactId || "")}</span>
                                          )}
                                        </div>
                                      );
                                    }
                                    const fieldValue = (emergencyContact as unknown as Record<string, unknown>)[field.key];
                                    if (fieldValue === undefined || fieldValue === null || fieldValue === "" || fieldValue === false) return null;
                                    return (
                                      <div key={field.key} className={field.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{field.label}</span>
                                        <span className="font-semibold text-foreground">{String(fieldValue)}</span>
                                      </div>
                                    );
                                  })}
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
                          type="text"
                          placeholder={t('contacts.detail.logEventOrNote')}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-2xl"
                        />
                        <Button
                          type="submit"
                          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-none"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </form>
                   </div>

                   <div className="space-y-6 relative pl-3">
                     <div className="absolute left-[3px] top-0 bottom-0 w-0.5 bg-border/50" />
                     {(!combinedActivities || combinedActivities.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                           <History className="w-12 h-12 mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">{t('contacts.detail.quietTimeline')}</p>
                        </div>
                     ) : (
                       combinedActivities.map((act) => {
                          const Icon = ICON_MAP[act.type] || History;
                          return (
                            <div key={act.id} className="relative pl-6 group">
                               <div className="absolute left-[-15.5px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                                  <Icon className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                               </div>
                               <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm group-hover:border-primary/20 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                       {ACTIVITY_TYPE_I18N[act.type] ? t(ACTIVITY_TYPE_I18N[act.type]) : act.type}
                                     </span>
                                     <span className="text-[10px] font-bold text-muted-foreground/60">{formatDate(act.date)}</span>
                                  </div>
                                  <p className="text-xs text-foreground font-medium leading-relaxed">{act.content}</p>
                                  {act.by && <span className="block mt-2 text-[9px] font-bold text-primary italic">— {act.by}</span>}
                               </div>
                            </div>
                          );
                       })
                     )}
                   </div>
                </div>
              )}

              {activeTab === "network" && (
                <div className="space-y-6">
                   <div className={`p-4 rounded-2xl border flex items-center gap-3 ${DETAIL_STYLES.networkHeader}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${DETAIL_STYLES.networkIcon}`}>
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
                           <Button variant="outline" className="mt-4 px-4 min-h-[44px] rounded-xl border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-none" type="button">{t('contacts.detail.addRelationship')}</Button>
                        </div>
                      ) : (
                        c.relationships.map((relationship, relationshipIndex) => {
                          const target = allContacts.find((contact) => String(contact.id) === String(relationship.contactId));
                          return (
                            <div key={relationshipIndex} className={`group flex items-center justify-between gap-3 p-4 rounded-2xl border bg-card transition-all ${DETAIL_STYLES.networkItemCard}`}>
                               <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${DETAIL_STYLES.networkItemIcon}`}>
                                     {target ? target.name.charAt(0) : "?"}
                                  </div>
                                  <div className="min-w-0">
                                     <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 block ${DETAIL_STYLES.networkRelType}`}>{relationship.relationship}</span>
                                     <h5 className="text-sm font-bold text-foreground truncate">{target ? target.name : `${t('contacts.table.contactIdPrefix')}${relationship.contactId}`}</h5>
                                  </div>
                               </div>
                               {target && (
                                   <Button variant="ghost" onClick={() => handleNavigateToContact(relationship.contactId)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all shadow-none ${DETAIL_STYLES.networkItemAction}`} type="button">
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
                   <div className="p-8 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center gap-3 bg-muted/20">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                         <FileText className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-foreground">{t('contacts.detail.cloudStorageRepository')}</h4>
                         <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">{t('contacts.detail.dragDropDocuments')}</p>
                      </div>
                      <Button className="mt-2 px-6 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-none" type="button">{t('contacts.detail.browseFiles')}</Button>
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
                               <a href={file.url} download={file.name} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-all">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                         ))
                      )}
                   </div>
                </div>
              )}

              
              {!["overview", "timeline", "network", "files"].includes(activeTab) && (
                 <div className="space-y-4">
                    {Object.entries(grouped)
                       .filter(([, fields]) => fields.some((field) => field.tab === activeTab))
                       .map(([group, fields]) => (
                       <div key={group} className="space-y-2">
                         <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{group}</h4>
                         <div className="relative overflow-hidden group/card bg-card/45 backdrop-blur-xs rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all duration-300 divide-y divide-border/50">
                           {fields.filter((field) => field.tab === activeTab).map((field) => {
                              const displayValue = formatFieldValue(field);
                              if (!displayValue) return null;
                              const Icon = ICON_MAP[field.key] || Tag;
                              return (
                                <div key={field.key} className="flex items-center gap-3 p-3 group/row">
                                  <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{field.label}</span>
                                    <span className="text-sm font-semibold text-foreground truncate">{displayValue}</span>
                                  </div>
                                </div>
                              );
                           })}
                         </div>
                       </div>
                    ))}
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
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
         </div>
      </motion.aside>
    </div>
  );
}
