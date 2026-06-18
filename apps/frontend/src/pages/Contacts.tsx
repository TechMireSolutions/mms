import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, MessageCircle, MessageSquare, Download, Users, UserX, RefreshCw, X, Loader2 } from "lucide-react";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import useTranslation from "@/hooks/useTranslation";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import ActionButton from "../components/ui/ActionButton";
import ContactsTable from "../components/contacts/ContactsTable";
import ContactsToolbar from "../components/contacts/ContactsToolbar";
import ErrorBoundary from "../components/ui/ErrorBoundary";

// Heavy components — loaded only when first needed
const ContactForm          = lazy(() => import("../components/contacts/ContactForm"));
const DuplicateDetection   = lazy(() => import("../components/contacts/DuplicateDetection"));
const WhatsAppPanel        = lazy(() => import("../components/contacts/WhatsAppPanel"));
const SmsPanel             = lazy(() => import("../components/contacts/SmsPanel"));
const ContactsSettingsPanel = lazy(() => import("../components/contacts/ContactsSettingsPanel"));
const ContactSyncPanel     = lazy(() => import("../components/contacts/ContactSyncPanel"));
const ContactKanban        = lazy(() => import("../components/contacts/ContactKanban"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}
import { saveCollection } from "../lib/db";
import { useContactsCollection, useContactMutations } from "../hooks/useContacts";
import { notify } from "@/lib/notify";
import {
  useContactConfig, useContactColumns, calculateProfileHealth
} from '@/lib/contexts/ContactConfigContext';
import {
  parsePhoneNumber,
  getPrimaryPhone,
  hasWhatsApp,
  Contact,
  PhoneNumber,
} from "@mms/shared";
import { EditableSelect } from "../components/contacts/form/FormPrimitives";

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-10 px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></th>
            {Array.from({ length: cols }).map((_, i) => <th key={i} className="px-4 py-3"><div className="h-3 w-20 rounded bg-muted animate-pulse" /></th>)}
            <th className="w-16 px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              <td className="px-4 py-3"><div className="w-4 h-4 rounded bg-muted animate-pulse" /></td>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div className="h-3 rounded bg-muted animate-pulse" style={{ width: `${50 + (c * 17 + r * 11) % 40}%` }} />
                </td>
              ))}
              <td className="px-4 py-3"><div className="w-6 h-6 rounded-lg bg-muted animate-pulse" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SettingsPanelProps {
  contacts: Contact[];
  onImport: (list: Contact[]) => void;
}

// ── Settings sub-panel ────────────────────────────────────────────────────────
function SettingsPanel({ contacts, onImport }: SettingsPanelProps) {
  const { fieldConfig, updateConfig } = useContactConfig();
  const settingsSubTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.settingsSubTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((t) => t.enabled);

    return sorted.map((t) => ({
      key: t.key,
      label: t.label,
    }));
  }, [fieldConfig.settingsSubTabs]);

  const [sub, setSub] = useState(() => settingsSubTabs[0]?.key || "fields");
  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={settingsSubTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        value={sub}
        onChange={setSub}
      />
      <Suspense fallback={<LazyFallback />}>
        {sub === "fields" && (
          <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig as (config: object) => void} mode="fields" />
        )}
        {sub === "preferences" && (
          <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig as (config: object) => void} mode="preferences" />
        )}
        {sub === "uistrings" && (
          <ContactsSettingsPanel config={fieldConfig} onConfigChange={updateConfig as (config: object) => void} mode="uistrings" />
        )}
        {sub === "sync" && (
          <ContactSyncPanel contacts={contacts} onImport={onImport as (contacts: object[]) => void} />
        )}
      </Suspense>
    </div>
  );
}

// ── Inner page (must be inside ContactConfigProvider) — Work | Reports | Setup ──
function ContactsInner() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const { fieldConfig, prefs, countryCodesMap, updateVisibleColumns, lifecycleStages, updateLifecycleStages, defaultContactRating, uiStrings } = useContactConfig();
  const tableColumns = useContactColumns(); // ← dynamic, auto-updates with config

  const [isLoading,       setIsLoading]       = useState(true);

  const { upsertContact, deleteContact } = useContactMutations();
  const rawContacts = useContactsCollection();

  const contacts = useMemo(() => {
    const country = prefs?.defaultCountry || "";
    const defaultCode = countryCodesMap[country] || "";
    return rawContacts.map((c) => {
      const base = {
        lifecycleStage: lifecycleStages[0] || "",
        rating: defaultContactRating,
        relationships: [],
        activities: [],
        ...c,
      } as Contact;
      if (base.phones && Array.isArray(base.phones)) {
        return {
          ...base,
          phones: base.phones.map((p: PhoneNumber) => {
            if (p.countryCode) return p;
            const parsed = parsePhoneNumber(p.number, defaultCode);
            return {
              ...p,
              countryCode: parsed.countryCode,
              number: parsed.number,
            };
          }),
        };
      }
      return base;
    });
  }, [rawContacts, prefs?.defaultCountry, countryCodesMap, lifecycleStages, defaultContactRating]);

  const saveContacts = useCallback((updater: Contact[] | ((prev: Contact[]) => Contact[])) => {
    const next = typeof updater === "function" ? updater(contacts) : updater;
    saveCollection("contacts", next);
  }, [contacts]);
  const [search,          setSearch]          = useState("");
  const [filterGender,    setFilterGender]    = useState("");
  const [filterStage,     setFilterStage]     = useState("");
  const [viewMode,        setViewMode]        = useState<"list" | "kanban">("list");
  useEffect(() => {
    if (prefs.defaultViewLayout === "list" || prefs.defaultViewLayout === "kanban") {
      setViewMode(prefs.defaultViewLayout);
    }
  }, [prefs.defaultViewLayout]);
  const [sortField,       setSortField]       = useState("name");
  const [sortDir,         setSortDir]         = useState<"asc" | "desc">("asc");
  const [selected,        setSelected]        = useState<(string | number)[]>([]);
  const [showForm,        setShowForm]        = useState(false);
  const [editContact,     setEditContact]     = useState<Contact | null>(null);
  const [showDuplicates,  setShowDuplicates]  = useState(false);
  const [whatsappTargets, setWhatsappTargets] = useState<Contact[] | null>(null);
  const [smsTargets, setSmsTargets] = useState<Contact[] | null>(null);
  const [activeTab,       setActiveTab]       = useState("work");

  const defaultCountry  = prefs.defaultCountry  || "";
  const defaultCity     = prefs.defaultCity     || "";
  const defaultProvince = prefs.defaultProvince || "";

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // ── Filtered + sorted contacts ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = contacts.filter((c) => {
      const stage = c.lifecycleStage || "Lead";
      if (filterStage && stage !== filterStage) return false;

      if (q) {
        const phone = getPrimaryPhone(c) || "";
        const email = (c.emails || [])[0]?.address || (c.email as string) || "";
        const city = (c.city as string) || "";
        const match =
          c.name?.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          phone.includes(q) ||
          city.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterGender && c.gender !== filterGender) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";

      if (sortField === "profileHealth") {
        av = calculateProfileHealth(a);
        bv = calculateProfileHealth(b);
      } else {
        av = typeof a[sortField] === "number" ? (a[sortField] as number) : String(a[sortField] || "").toLowerCase();
        bv = typeof b[sortField] === "number" ? (b[sortField] as number) : String(b[sortField] || "").toLowerCase();
      }

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [contacts, search, filterGender, filterStage, sortField, sortDir]);

  const hasActiveFilters  = !!(filterGender || filterStage || search);
  const activeFilterCount = (filterGender ? 1 : 0) + (filterStage ? 1 : 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }, [sortField]);

  const handleSelect    = useCallback((id: string | number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]), []);
  const handleSelectAll = useCallback(() => setSelected((s) => s.length === filtered.length ? [] : filtered.map((c) => c.id)), [filtered]);

  const handleEdit = useCallback((c: Contact) => { setEditContact(c); setShowForm(true); }, []);
  const handleNew  = useCallback(() => { setEditContact(null); setShowForm(true); }, []);

  const handleSave = useCallback((data: Contact) => {
    const payload = editContact
      ? { ...editContact, ...data }
      : { ...data, id: data.id ?? Date.now() };
    void upsertContact.mutateAsync(payload).then(() => {
      setShowForm(false);
      setEditContact(null);
    }).catch(() => {
      notify.error(t("settings.serverSaveFailed"));
    });
  }, [editContact, upsertContact, t]);

  const handleDelete = useCallback((id: string | number) => {
    const c = contacts.find((x) => x.id === id);
    void deleteContact.mutateAsync(String(id)).then(() => {
      notify.info(t("contacts.deletedTitle"), {
        description: c?.name
          ? t("contacts.deletedDescription", { name: c.name })
          : t("contacts.deletedDescriptionDefault"),
      });
    }).catch(() => {
      notify.error(t("settings.serverSaveFailed"));
    });
  }, [contacts, t, deleteContact]);

  const handleExportCSV = () => {
    const headers = visibleColumns.map((c) => c.label);
    const rows = [headers];
    filtered.forEach((c) => {
      const row = visibleColumns.map(({ id }) => {
        if (id === "name") return c.name || "";
        if (id === "phone") return getPrimaryPhone(c) || "";
        if (id === "email") return (c.emails || [])[0]?.address || (c.email as string) || "";
        if (id === "whatsapp") return hasWhatsApp(c) ? "Yes" : "No";
        if (id === "city") return (c.addresses || [])[0]?.city || (c.city as string) || "";
        if (id === "state") return (c.addresses || [])[0]?.state || (c.state as string) || "";
        if (id === "country") return (c.addresses || [])[0]?.country || (c.country as string) || "";
        const val = c[id];
        if (val === undefined || val === null) return "";
        return String(val);
      });
      rows.push(row);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = uiStrings.exportFilename || "contacts.csv";
    a.click();
  };

  const clearFilters = useCallback(() => { setFilterGender(""); setFilterStage(""); setSearch(""); }, []);

  const visibleColumns = tableColumns;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <title>MMS - {t("nav.contacts")}</title>
      <meta name="description" content={t("contacts.pageDescription")} />
      <PageHeader
        icon={Users}
        title={t("nav.contacts")}
        subtitle={t("contacts.subtitleCount", { total: contacts.length, shown: filtered.length })}
        actions={
          <>
            <ActionButton variant="ghost" icon={AlertTriangle} onClick={() => setShowDuplicates(true)}>{t("contacts.duplicates")}</ActionButton>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Download className="w-3.5 h-3.5" /> {t("common.export")}
            </button>
            <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>{t("contacts.addContact")}</ActionButton>
          </>
        }
      />

      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="contacts-tab"
      >
      <AnimatePresence mode="wait">
        {activeTab === "work" ? (
          <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                  {t("module.work")} ({viewMode === "kanban" ? (uiStrings.kanbanBoard || "Kanban Board") : (uiStrings.listView || "List View")})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{uiStrings.stageLabel || "Stage:"}</span>
                <EditableSelect
                  options={lifecycleStages || []}
                  value={filterStage}
                  onChange={(val) => setFilterStage(val)}
                  onUpdateOptions={updateLifecycleStages}
                  placeholder={uiStrings.allStages || "All Stages"}
                  className="w-40"
                />
              </div>
            </div>

            <ErrorBoundary>
              <ContactsToolbar
                search={search}             onSearchChange={setSearch}
                filterGender={filterGender} onGenderChange={setFilterGender}
                sortField={sortField}       onSort={handleSort}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onClearFilters={clearFilters}
              />
            </ErrorBoundary>

            {/* Active filter chips */}
            <AnimatePresence>
              {(filterGender || filterStage) && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex flex-wrap gap-1.5">
                  {filterGender && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      {uiStrings.genderFilterLabel || "Gender"}: {filterGender} <button onClick={() => setFilterGender("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterStage && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      {uiStrings.stageLabel || "Stage:"} {filterStage} <button onClick={() => setFilterStage("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bulk action bar */}
            <AnimatePresence>
              {selected.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-primary/[0.05] border border-primary/20 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{selected.length} {uiStrings.selectedCount || "selected"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const targets = contacts.filter((c) => selected.includes(c.id));
                      const waTargets = targets.filter((c) => hasWhatsApp(c));
                      const smsReady = targets.filter((c) => Boolean(getPrimaryPhone(c)));
                      const waClickable = waTargets.length > 0;
                      const smsClickable = smsReady.length > 0;
                      return (
                        <>
                          <button
                            disabled={!waClickable}
                            onClick={() => setWhatsappTargets(waTargets)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                              waClickable ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
                            }`}
                            style={{ background: uiStrings.whatsappColor || "#075E54" }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp ({waTargets.length})
                          </button>
                          <button
                            disabled={!smsClickable}
                            onClick={() => setSmsTargets(smsReady)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/40 bg-primary/10 text-sm font-semibold text-primary transition-all dark:border-primary/40 dark:bg-primary/20 dark:text-primary ${
                              smsClickable ? "hover:scale-[1.02] active:scale-[0.98]" : "opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> {uiStrings.sms || "SMS"} ({smsReady.length})
                          </button>
                        </>
                      );
                    })()}
                    <button onClick={() => setSelected([])} className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      {uiStrings.deselect || "Deselect"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content area */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TableSkeleton rows={6} cols={visibleColumns.length} />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-border text-muted-foreground gap-3">
                      <UserX className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-semibold">{hasActiveFilters ? (uiStrings.noContactsMatchFilters || "No contacts match your filters") : (uiStrings.noContactsYet || "No contacts yet")}</p>
                      <p className="text-xs text-center max-w-xs">{hasActiveFilters ? (uiStrings.tryAdjustingFilters || "Try adjusting your search or filters.") : (uiStrings.clickAddContact || "Click \"Add Contact\" to create your first contact.")}</p>
                      {hasActiveFilters && (
                        <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                          <RefreshCw className="w-3 h-3" /> {uiStrings.clearFiltersBtn || "Clear Filters"}
                        </button>
                      )}
                    </div>
                  ) : (
                    viewMode === "list" ? (
                      <ErrorBoundary>
                        <ContactsTable
                          contacts={filtered} selected={selected}
                          onSelect={handleSelect} onSelectAll={handleSelectAll}
                          onEdit={handleEdit as (contact: object) => void} onDelete={handleDelete}
                          onWhatsApp={(targets) => setWhatsappTargets(targets as Contact[])}
                          onSms={(targets) => setSmsTargets(targets as Contact[])}
                          sortField={sortField} sortDir={sortDir} onSort={handleSort}
                          columns={visibleColumns}
                          allContacts={contacts}
                          onUpdateContact={(updated) => saveContacts((cs) => cs.map((x) => x.id === updated.id ? updated : x))}
                        />
                      </ErrorBoundary>
                    ) : (
                      <Suspense fallback={<LazyFallback />}>
                        <ErrorBoundary>
                          <ContactKanban
                            contacts={filtered}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onWhatsApp={(targets: Contact[]) => setWhatsappTargets(targets)}
                            onSms={(targets: Contact[]) => setSmsTargets(targets)}
                            onStageChange={(id: string | number, newStage: string) => {
                              saveContacts((cs) => cs.map((c) => {
                                if (c.id === id) {
                                  const oldStage = c.lifecycleStage || "Lead";
                                  const stageActivity = {
                                    id: `act-${Date.now()}`,
                                    type: "stage_change" as const,
                                    content: `${uiStrings.lifecycleStageUpdatedFrom || "Lifecycle stage updated from"} ${oldStage} ${uiStrings.to || "to"} ${newStage}`,
                                    date: new Date().toISOString().slice(0, 10),
                                    by: "System"
                                  };
                                  return {
                                    ...c,
                                    lifecycleStage: newStage,
                                    activities: [stageActivity, ...(c.activities || [])]
                                  };
                                }
                                return c;
                              }));
                              notify.success(uiStrings.stageUpdatedTitle || "Stage updated", {
                                description: `${uiStrings.contactStageUpdatedTo || "Contact stage updated to"} ${newStage}`
                              });
                            }}
                            fieldConfig={fieldConfig}
                          />
                        </ErrorBoundary>
                      </Suspense>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        ) : activeTab === "reports" ? (
          <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <div className="space-y-4">
                <KPISummary category="contacts" />
                <ModuleReports category="contacts" />
              </div>
            </ErrorBoundary>
          </motion.div>
        ) : (
          <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <ErrorBoundary>
              <SettingsPanel
                contacts={contacts}
                onImport={(list: Contact[]) => {
                  saveContacts((cs) => [...cs, ...list]);
                  notify.success(`${list.length} ${list.length !== 1 ? (uiStrings.contactsImportedSuccessfully || "contacts imported successfully") : (uiStrings.contactImportedSuccessfully || "contact imported successfully")}`);
                }}
              />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      {/* Modals — lazy loaded, only mounted when needed */}
      <Suspense fallback={null}>
        <AnimatePresence>
          <ContactForm
              open={showForm}
              key={editContact?.id || "new"}
              contact={editContact ?? undefined}
              allContacts={contacts}
              defaultCountry={defaultCountry}
              defaultCity={defaultCity}
              defaultProvince={defaultProvince}
              onClose={() => { setShowForm(false); setEditContact(null); }}
              onSave={handleSave as (contact: object) => void}
            />
          {showDuplicates && (
            <DuplicateDetection
              contacts={contacts}
              onClose={() => setShowDuplicates(false)}
              onMerge={(keepId, deleteId, mergedData) => {
                saveContacts((cs) =>
                  cs
                    .map((c) => (c.id === keepId ? { ...c, ...mergedData } : c))
                    .filter((c) => c.id !== deleteId)
                );
                notify.success(uiStrings.contactsMergedTitle || "Contacts merged", {
                  description: uiStrings.duplicateContactMergedSuccess || "The duplicate contact was merged successfully.",
                });
              }}
            />
          )}
          {whatsappTargets && <WhatsAppPanel contacts={whatsappTargets} onClose={() => setWhatsappTargets(null)} />}
          {smsTargets && <SmsPanel contacts={smsTargets} onClose={() => setSmsTargets(null)} />}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default ContactsInner;