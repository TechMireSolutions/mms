import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit2, MessageCircle, MessageSquare, Phone, Mail,
  ExternalLink, Calendar, User, Clock, Tag,
  Star, Send, LucideIcon,
  LayoutDashboard, History, Users as UsersIcon, FileText, BrainCircuit, ShieldCheck, Search, Zap
} from "lucide-react";
import { Contact, ContactActivity } from "@mms/shared";
import { useContactConfig, calculateProfileHealth } from '@/lib/contexts/ContactConfigContext';
import { getDisplayName, getPrimaryPhone, getPrimaryEmail, hasWhatsApp, calcAge } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { useAuth } from '@/lib/contexts/AuthContext';
import useBodyScrollLock from "../../hooks/useBodyScrollLock";


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
};

import ContactAvatar from "./ContactAvatar";



interface ContactDetailDrawerProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onWhatsApp: (contacts: Contact[]) => void;
  onSms: (contacts: Contact[]) => void;
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
  allContacts = [],
  onUpdateContact,
}: ContactDetailDrawerProps): React.JSX.Element {
  const { enabledTabIds, isTabFieldEnabled, fieldConfig, lifecycleColors, uiStrings, fields } = useContactConfig();
  const { user } = useAuth();
  useBodyScrollLock();

  // Local contact state to support switching dynamically via relationship links
  const [c, setC] = useState<Contact>(initialContact);
  const [noteText, setNoteText] = useState<string>("");
  
  const detailTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.detailTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((t) => t.enabled && (["overview", "timeline", "network", "files"].includes(t.key) || enabledTabIds.has(t.key)));

    return sorted.map((t) => ({
      key: t.key,
      label: t.label,
      icon: ICON_MAP[t.icon || t.key] || LayoutDashboard,
    }));
  }, [fieldConfig.detailTabs, enabledTabIds]);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return detailTabs[0]?.key || "";
  });

  const heroFieldsStr = uiStrings?.heroFields || "";
  const heroFields = useMemo(() => heroFieldsStr.split(",").map(s => s.trim()), [heroFieldsStr]);

  useEffect(() => {
    setC(initialContact);
  }, [initialContact]);

  const health = calculateProfileHealth(c);
  const rating = c.rating || 0;

  const age = calcAge(c.dob as string | null);

  const allFields = useMemo(() => {
    return Object.entries(fields).flatMap(([tabId, tabFields]) =>
      (tabFields || []).map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        tab: tabId,
        group: f.group || uiStrings?.extendedProfiles || uiStrings?.otherGroup,
        description: f.description || "",
      }))
    );
  }, [fields, uiStrings]);

  const fieldsToRender = allFields.filter(
    (f) =>
      !heroFields.includes(f.key) &&
      isTabFieldEnabled(f.tab, f.key) &&
      c[f.key] !== undefined && c[f.key] !== null && c[f.key] !== "" && c[f.key] !== false &&
      !(Array.isArray(c[f.key]) && (c[f.key] as unknown[]).length === 0)
  );

  // Group by field group
  const grouped = fieldsToRender.reduce<Record<string, typeof fieldsToRender>>((acc, f) => {
    const g = f.group || uiStrings?.otherGroup;
    if (!acc[g]) acc[g] = [];
    acc[g].push(f);
    return acc;
  }, {});

  const formatFieldValue = (field: { key: string, type: string }): string | null => {
    const val = c[field.key];
    if (val === undefined || val === null || val === "" || val === false) return null;
    if (Array.isArray(val)) return val.length ? val.join(", ") : null;
    if (field.key === "dob") {
      try {
        const yrsLabel = uiStrings?.yearsOld;
        return `${formatDate(val as string, true)}${age ? ` (${age} ${yrsLabel})` : ""}`;
      } catch (err) {
        console.error("Failed parsing DOB value:", val, err);
        return String(val);
      }
    }
    return String(val);
  };

  const primaryPhone = enabledTabIds.has("phones") ? getPrimaryPhone(c) : null;
  const primaryEmail = enabledTabIds.has("emails") ? getPrimaryEmail(c) : null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const newActivity: ContactActivity = {
      id: `act-${Date.now()}`,
      type: "note",
      content: noteText.trim(),
      date: new Date().toISOString().slice(0, 10),
      by: user?.name || uiStrings?.systemUser
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

  const handleNavigateToContact = (targetId: string | number) => {
    const target = allContacts.find((x) => String(x.id) === String(targetId));
    if (target) {
      setC(target);
    }
  };

  const stage = c.lifecycleStage || uiStrings.defaultLifecycleStage;
  const stageColors = lifecycleColors[stage] || { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", border: "border-border" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.aside
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-2xl flex flex-col z-10"
        aria-label={uiStrings.contactDetails}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm z-10 px-5 pt-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center relative border border-border"
                style={{
                  background: `conic-gradient(${
                    health >= 80 ? uiStrings?.healthColorHigh : health >= 50 ? uiStrings?.healthColorMedium : uiStrings?.healthColorLow
                  } ${health * 3.6}deg, hsl(var(--muted)) 0deg)`
                }}
              >
                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-[10px] font-bold text-foreground">
                  {health}%
                </div>
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-foreground leading-tight">{uiStrings.profileIntelligence}</h2>
                <div className="flex items-center gap-1">
                   <ShieldCheck className={`w-3 h-3 ${health >= 80 ? uiStrings?.healthClassHigh : health >= 50 ? uiStrings?.healthClassMedium : uiStrings?.healthClassLow}`} />
                   <span className="text-[9px] font-semibold text-muted-foreground uppercase">{health >= 80 ? uiStrings.verified : uiStrings.incomplete}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(c)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={uiStrings.editProfile}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                aria-label={uiStrings.closeDetails}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex gap-1">
            {detailTabs.map((t: { key: string; label: string; icon: LucideIcon | typeof Tag }) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 flex flex-col items-center min-h-[44px] justify-center gap-1.5 py-2 border-b-2 transition-all ${
                    isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
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
                  {/* Hero */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                    <ContactAvatar contact={c} uiStrings={uiStrings} className="w-16 h-16 rounded-2xl text-2xl" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate leading-tight">{getDisplayName(c)}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black border ${stageColors.bg} uppercase tracking-wider`}>
                          {stage}
                        </span>
                        {c.isSyed && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${uiStrings?.syedBadgeClass}`}>
                            {uiStrings.yesSyed}
                          </span>
                        )}
                      </div>
                      {rating > 0 && (
                        <div className="flex items-center gap-0.5 mt-2">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${idx < rating ? uiStrings?.starActiveClass : uiStrings?.starInactiveClass}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Insights */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-primary">
                       <BrainCircuit className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{uiStrings.aiIntelligence}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-[12px] text-foreground leading-relaxed italic">
                      {c.aiSummary || uiStrings.defaultAiSummary}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {enabledTabIds.has("phones") && (
                      <button
                        disabled={!hasWhatsApp(c)}
                        onClick={() => onWhatsApp([c])}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                          hasWhatsApp(c) ? uiStrings?.whatsappActiveClass : uiStrings?.whatsappDisabledClass
                        }`}
                        type="button"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-[10px] font-bold">{uiStrings.whatsapp}</span>
                      </button>
                    )}
                    {primaryPhone && (
                      <button
                        onClick={() => onSms([c])}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${uiStrings?.smsActionClass}`}
                        type="button"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-[10px] font-bold">{uiStrings.sms}</span>
                      </button>
                    )}
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone.replace(/[^\d+]/g, "")}`}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${uiStrings?.callActionClass}`}
                      >
                        <Phone className="w-5 h-5" />
                        <span className="text-[10px] font-bold">{uiStrings.call}</span>
                      </a>
                    )}
                    {primaryEmail && (
                      <a
                        href={`mailto:${primaryEmail}`}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${uiStrings?.emailActionClass}`}
                      >
                        <Mail className="w-5 h-5" />
                        <span className="text-[10px] font-bold">{uiStrings.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Identity Grid */}
                  <div className="space-y-4">
                    {Object.entries(grouped).filter(([_, fields]) => fields.some(f => f.tab === "basic" || !["timeline", "network", "files"].includes(f.tab))).map(([group, fields]) => (
                      <div key={group} className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{group}</h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {fields.map(f => {
                             const val = formatFieldValue(f);
                             if (!val) return null;
                             const Icon = ICON_MAP[f.key] || Tag;
                             return (
                               <div key={f.key} className="flex items-center gap-3 p-3 group/row">
                                 <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                   <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{f.label}</span>
                                   <span className="text-sm font-semibold text-foreground truncate">{val}</span>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Dynamic List Sections (Phones, Emails, Addresses, Socials, Emergency) */}
                    {enabledTabIds.has("phones") && c.phones && c.phones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {uiStrings.phones}
                        </h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {c.phones.map((p, idx) => {
                            const tabFields = (fields.phones || []).filter(f => f.enabled && f.key !== "label");
                            return (
                              <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {p.label || uiStrings.mobileLabel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map(f => {
                                    const val = (p as unknown as Record<string, unknown>)[f.key];
                                    if (val === undefined || val === null || val === "" || val === false) return null;
                                    const displayVal = typeof val === "boolean" ? (val ? uiStrings.yes : uiStrings.no) : String(val);
                                    return (
                                      <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                        <span className="font-semibold text-foreground">{displayVal}</span>
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

                    {enabledTabIds.has("emails") && c.emails && c.emails.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {uiStrings.emails}
                        </h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {c.emails.map((e, idx) => {
                            const tabFields = (fields.emails || []).filter(f => f.enabled && f.key !== "label");
                            return (
                              <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {e.label || uiStrings.personalLabel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map(f => {
                                    const val = (e as unknown as Record<string, unknown>)[f.key];
                                    if (val === undefined || val === null || val === "" || val === false) return null;
                                    return (
                                      <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                        <span className="font-semibold text-foreground">{String(val)}</span>
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

                    {enabledTabIds.has("addresses") && c.addresses && c.addresses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {uiStrings.addresses}
                        </h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {c.addresses.map((a, idx) => {
                            const tabFields = (fields.addresses || []).filter(f => f.enabled && f.key !== "label");
                            return (
                              <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {a.label || uiStrings.homeLabel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map(f => {
                                    const val = (a as unknown as Record<string, unknown>)[f.key];
                                    if (val === undefined || val === null || val === "" || val === false) return null;
                                    return (
                                      <div key={f.key} className={f.type === "textarea" || f.key === "line1" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                        <span className="font-semibold text-foreground">{String(val)}</span>
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

                    {enabledTabIds.has("socials") && c.socials && c.socials.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {uiStrings.socials}
                        </h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {c.socials.map((s, idx) => {
                            const tabFields = (fields.socials || []).filter(f => f.enabled && f.key !== "platform");
                            return (
                              <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
                                    {s.platform || uiStrings.facebookLabel}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map(f => {
                                    const val = (s as unknown as Record<string, unknown>)[f.key];
                                    if (val === undefined || val === null || val === "" || val === false) return null;
                                    return (
                                      <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                        {f.type === "url" ? (
                                          <a
                                            href={String(val).startsWith("http") ? String(val) : `https://${val}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-primary hover:underline inline-flex items-center gap-1 truncate"
                                          >
                                            {String(val)} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                          </a>
                                        ) : (
                                          <span className="font-semibold text-foreground">{String(val)}</span>
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

                    {enabledTabIds.has("emergency") && c.emergencyContacts && c.emergencyContacts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                          {uiStrings.emergency}
                        </h4>
                        <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                          {c.emergencyContacts.map((ec, idx) => {
                            const tabFields = (fields.emergency || []).filter(f => f.enabled);
                            const target = allContacts.find(x => String(x.id) === String(ec.contactId));
                            return (
                              <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${uiStrings?.emergencyBadgeClass || "bg-destructive/10 text-destructive border-destructive/30"}`}>
                                    {uiStrings.emergencyContact}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                  {tabFields.map(f => {
                                    if (f.key === "contactId") {
                                      return (
                                        <div key={f.key} className="col-span-2">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                          {target ? (
                                            <button
                                              type="button"
                                              onClick={() => handleNavigateToContact(target.id)}
                                              className="font-semibold text-primary hover:underline text-left"
                                            >
                                              {target.name}
                                            </button>
                                          ) : (
                                            <span className="font-semibold text-foreground">{String(ec.contactId || "")}</span>
                                          )}
                                        </div>
                                      );
                                    }
                                    const val = (ec as unknown as Record<string, unknown>)[f.key];
                                    if (val === undefined || val === null || val === "" || val === false) return null;
                                    return (
                                      <div key={f.key} className={f.type === "textarea" ? "col-span-2" : ""}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">{f.label}</span>
                                        <span className="font-semibold text-foreground">{String(val)}</span>
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
                        <input
                          type="text"
                          placeholder={uiStrings.logEventOrNote}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-2xl border border-border text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        />
                        <button
                          type="submit"
                          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/20"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                   </div>

                   <div className="space-y-6 relative pl-3">
                     <div className="absolute left-[3px] top-0 bottom-0 w-0.5 bg-border/50" />
                     {(!c.activities || c.activities.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-30">
                           <History className="w-12 h-12 mb-2" />
                           <p className="text-xs font-bold uppercase tracking-widest">{uiStrings.quietTimeline}</p>
                        </div>
                     ) : (
                       c.activities.map((act) => {
                          const Icon = ICON_MAP[act.type] || History;
                          return (
                            <div key={act.id} className="relative pl-6 group">
                               <div className="absolute left-[-15.5px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 group-hover:border-primary transition-colors">
                                  <Icon className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary" />
                               </div>
                               <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm group-hover:border-primary/20 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{uiStrings[act.type]}</span>
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
                   <div className={`p-4 rounded-2xl border flex items-center gap-3 ${uiStrings?.networkHeaderClass}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${uiStrings?.networkIconContainerClass}`}>
                         <UsersIcon className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className={`text-sm font-bold leading-none ${uiStrings?.networkTitleClass}`}>{c.relationships?.length || 0} {uiStrings.relationships}</h4>
                         <p className={`text-[10px] font-medium mt-1 uppercase tracking-tight ${uiStrings?.networkSubtitleClass}`}>{uiStrings.activeSocialGraph}</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                     {(!c.relationships || c.relationships.length === 0) ? (
                        <div className="text-center py-20">
                           <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground/20" />
                           <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">{uiStrings.noConnectionsMapped}</p>
                           <button className="mt-4 px-4 min-h-[44px] rounded-xl border border-border text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all" type="button">{uiStrings.addRelationship}</button>
                        </div>
                     ) : (
                        c.relationships.map((rel, i) => {
                          const target = allContacts.find(x => String(x.id) === String(rel.contactId));
                          return (
                            <div key={i} className={`group flex items-center justify-between gap-3 p-4 rounded-2xl border bg-card transition-all ${uiStrings?.networkItemCardClass}`}>
                               <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${uiStrings?.networkItemIconClass}`}>
                                     {target ? target.name.charAt(0) : uiStrings?.unknownInitial}
                                  </div>
                                  <div className="min-w-0">
                                     <span className={`text-[9px] font-black uppercase tracking-widest mb-0.5 block ${uiStrings?.networkRelTypeClass}`}>{uiStrings[rel.type]}</span>
                                     <h5 className="text-sm font-bold text-foreground truncate">{target ? target.name : `${uiStrings.contactIdPrefix}${rel.contactId}`}</h5>
                                  </div>
                               </div>
                               {target && (
                                   <button onClick={() => handleNavigateToContact(rel.contactId)} className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all ${uiStrings?.networkItemActionClass}`} type="button">
                                     <Search className="w-4 h-4" />
                                  </button>
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
                         <h4 className="text-sm font-bold text-foreground">{uiStrings.cloudStorageRepository}</h4>
                         <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">{uiStrings.dragDropDocuments}</p>
                      </div>
                      <button className="mt-2 px-6 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all" type="button">{uiStrings.browseFiles}</button>
                   </div>

                   <div className="space-y-3">
                      {(!c.attachments || c.attachments.length === 0) ? (
                         <div className="py-10 text-center">
                             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{uiStrings.repositoryEmpty}</p>
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
                                     <p className="text-[9px] text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} {uiStrings.kbLabel} · {formatDate(file.date)}</p>
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

              {/* Fallback for custom tabs */}
              {!["overview", "timeline", "network", "files"].includes(activeTab) && (
                 <div className="space-y-4">
                    {Object.entries(grouped)
                       .filter(([_, fields]) => fields.some(f => f.tab === activeTab))
                       .map(([group, fields]) => (
                       <div key={group} className="space-y-2">
                         <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{group}</h4>
                         <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
                           {fields.filter(f => f.tab === activeTab).map(f => {
                              const val = formatFieldValue(f);
                              if (!val) return null;
                              const Icon = ICON_MAP[f.key] || Tag;
                              return (
                                <div key={f.key} className="flex items-center gap-3 p-3 group/row">
                                  <div className="p-2 rounded-lg bg-muted group-hover/row:bg-primary/10 transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">{f.label}</span>
                                    <span className="text-sm font-semibold text-foreground truncate">{val}</span>
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

        {/* Footer Meta */}
        <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
           <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {(c.updatedAt || c.createdAt) && (
                <span>{uiStrings.updatedLabel} {formatDate((c.updatedAt || c.createdAt) as string)}</span>
              )}
           </div>
           <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${uiStrings?.liveIntelIndicatorClass}`} />
              <span className={`text-[9px] font-bold uppercase ${uiStrings?.liveIntelTextClass}`}>{uiStrings.liveIntel}</span>
           </div>
         </div>
      </motion.aside>
    </div>
  );
}
