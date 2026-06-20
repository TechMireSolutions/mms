import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, AlertTriangle, MessageCircle, MessageSquare, Download, Users, UserX, RefreshCw, X, Loader2, LayoutList, LayoutGrid } from "lucide-react";
import type { AppTranslationKey } from "@mms/shared";
import useModuleTierTabs from "@/hooks/useModuleTierTabs";
import useTranslation from "@/hooks/useTranslation";
import usePermissions from "@/hooks/usePermissions";
import { useContacts, useContactsCollection } from "@/hooks/useContacts";
import { useContactsPageActions } from "@/hooks/useContactsPageActions";
import ModuleReports from "../components/reports/ModuleReports";
import KPISummary from "../components/reports/KPISummary";
import PageHeader from "../components/ui/PageHeader";
import ResponsiveAccordionTabs from "@/components/ui/ResponsiveAccordionTabs";
import SubTabBar from "@/components/ui/SubTabBar";
import ActionButton from "../components/ui/ActionButton";
import ContactsTable from "../components/contacts/ContactsTable";
import ContactsToolbar from "../components/contacts/ContactsToolbar";
import ContactStatsBar from "../components/contacts/ContactStatsBar";
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
  canWrite: boolean;
}

const SETUP_TAB_LABEL_KEYS: Record<string, AppTranslationKey> = {
  fields: "contacts.setup.fields",
  preferences: "contacts.setup.preferences",
  sync: "contacts.setup.sync",
  uistrings: "contacts.setup.uiStrings",
};

// ── Settings sub-panel ────────────────────────────────────────────────────────
function SettingsPanel({ contacts, onImport, canWrite }: SettingsPanelProps) {
  const { t } = useTranslation();
  const { fieldConfig, updateConfig } = useContactConfig();
  const settingsSubTabs = useMemo(() => {
    const tabsFromConfig = fieldConfig.settingsSubTabs || [];
    const sorted = [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tab) => tab.enabled);

    return sorted.map((tab) => ({
      key: tab.key,
      label: SETUP_TAB_LABEL_KEYS[tab.key] ? t(SETUP_TAB_LABEL_KEYS[tab.key]) : tab.label,
    }));
  }, [fieldConfig.settingsSubTabs, t]);

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
          <ContactSyncPanel contacts={contacts} onImport={onImport as (contacts: object[]) => void} canWrite={canWrite} />
        )}
      </Suspense>
    </div>
  );
}

// ── Inner page (must be inside ContactConfigProvider) — Work | Reports | Setup ──
function ContactsInner() {
  const PAGE_TABS = useModuleTierTabs();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const canWrite = can("contacts.write");
  const { fieldConfig, prefs, countryCodesMap, updateVisibleColumns, lifecycleStages, updateLifecycleStages, defaultContactRating, uiStrings } = useContactConfig();
  const tableColumns = useContactColumns();
  const { isLoading: isContactsLoading } = useContacts();
  const { saveContact, removeContact, mergeContacts, importContacts, updateStage, updateContact } =
    useContactsPageActions();

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

  const genderLabel = useCallback(
    (gender: string) => {
      const key = `contacts.gender.${gender.toLowerCase()}` as AppTranslationKey;
      const translated = t(key);
      return translated === key ? gender.charAt(0).toUpperCase() + gender.slice(1) : translated;
    },
    [t],
  );

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

  const handleEdit = useCallback((c: Contact) => {
    if (!canWrite) return;
    setEditContact(c);
    setShowForm(true);
  }, [canWrite]);
  const handleNew = useCallback(() => {
    if (!canWrite) return;
    setEditContact(null);
    setShowForm(true);
  }, [canWrite]);

  const handleSave = useCallback((data: Contact) => {
    if (!canWrite) return;
    const isNew = !editContact;
    const payload = editContact
      ? { ...editContact, ...data }
      : { ...data, id: data.id ?? Date.now() };
    void saveContact(payload, isNew).then(() => {
      setShowForm(false);
      setEditContact(null);
    }).catch(() => {});
  }, [editContact, saveContact, canWrite]);

  const handleDelete = useCallback((id: string | number) => {
    if (!canWrite) return;
    const c = contacts.find((x) => x.id === id);
    void removeContact(id, c?.name);
  }, [contacts, removeContact, canWrite]);

  const handleUpdateContact = useCallback((updated: Contact) => {
    if (!canWrite) return;
    void updateContact.mutateAsync({ id: String(updated.id), contact: updated }).catch(() => {});
  }, [canWrite, updateContact]);

  const handleStageChange = useCallback((id: string | number, newStage: string) => {
    if (!canWrite) return;
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    const oldStage = c.lifecycleStage || "Lead";
    const activityContent = `${uiStrings.lifecycleStageUpdatedFrom || "Lifecycle stage updated from"} ${oldStage} ${uiStrings.to || "to"} ${newStage}`;
    void updateStage(c, newStage, activityContent);
  }, [canWrite, contacts, uiStrings, updateStage]);

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
            {canWrite && (
              <ActionButton variant="primary" icon={UserPlus} onClick={handleNew}>{t("contacts.addContact")}</ActionButton>
            )}
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
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
                  {t("contacts.viewLayout")}: {viewMode === "kanban" ? t("contacts.kanbanView") : t("contacts.listView")}
                </span>
                <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    aria-pressed={viewMode === "list"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutList className="w-3.5 h-3.5" /> {t("contacts.listView")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("kanban")}
                    aria-pressed={viewMode === "kanban"}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> {t("contacts.kanbanView")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("contacts.stageLabel")}:</span>
                <EditableSelect
                  options={lifecycleStages || []}
                  value={filterStage}
                  onChange={(val) => setFilterStage(val)}
                  onUpdateOptions={canWrite ? updateLifecycleStages : () => {}}
                  placeholder={t("contacts.allStages")}
                  className="w-40"
                />
              </div>
            </div>

            <ContactStatsBar contacts={contacts} fieldConfig={fieldConfig} />

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
                      {uiStrings.genderFilterLabel || "Gender"}: {genderLabel(filterGender)} <button onClick={() => setFilterGender("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {filterStage && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                      {t("contacts.stageLabel")}: {filterStage} <button onClick={() => setFilterStage("")} className="hover:opacity-70"><X className="w-3 h-3" /></button>
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
                    <span className="text-sm font-semibold text-foreground">{t("contacts.selectedCount", { count: selected.length })}</span>
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
                      {t("contacts.deselect")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content area */}
            <AnimatePresence mode="wait">
              {isContactsLoading ? (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TableSkeleton rows={6} cols={visibleColumns.length} />
                </motion.div>
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 rounded-xl border-2 border-dashed border-border text-muted-foreground gap-3">
                      <UserX className="w-8 h-8 opacity-30" />
                      <p className="text-sm font-semibold">{hasActiveFilters ? t("contacts.noContactsMatchFilters") : t("contacts.noContactsYet")}</p>
                      <p className="text-xs text-center max-w-xs">{hasActiveFilters ? t("contacts.tryAdjustingFilters") : t("contacts.clickAddContact")}</p>
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
                          onUpdateContact={handleUpdateContact}
                          canWrite={canWrite}
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
                            onStageChange={handleStageChange}
                            fieldConfig={fieldConfig}
                            canWrite={canWrite}
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
                canWrite={canWrite}
                onImport={(list: Contact[]) => {
                  if (!canWrite) return;
                  void importContacts(list);
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
                if (!canWrite) return;
                void mergeContacts(keepId, deleteId, mergedData as Contact);
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