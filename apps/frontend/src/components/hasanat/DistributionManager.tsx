import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, X, Star, User, Users2, Filter, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Distribution, Denomination, StockBatch } from '@/lib/data/hasanatData';
import { getObject } from "../../lib/db";
import {
  DEFAULT_HASANAT_SETTINGS,
  DEFAULT_HASANAT_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";
import FormModal from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import RegistryPersonSelect from "@/components/ui/RegistryPersonSelect";
import UserActorSelect from "@/components/ui/UserActorSelect";
import useTranslation from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";

const STATUS_CFG: Record<string, { label: string, cls: string }> = {
  active:   { label: "Active",   cls: "bg-info/10 text-info border-info/20" },
  redeemed: { label: "Redeemed", cls: "bg-primary/10 text-primary border-primary/20" },
  returned: { label: "Returned", cls: "bg-muted text-muted-foreground border-border" },
};

const EMPTY_DIST: Partial<Distribution> = {
  denominationId: "",
  recipientType: "student",
  recipientStudentId: "",
  recipientTeacherId: "",
  recipientClass: "",
  quantity: 1,
  reason: "",
  issuedDate: new Date().toISOString().split("T")[0],
  issuedByUserId: "",
};

interface DistributeModalProps {
  open: boolean;
  denoms: Denomination[];
  batches: StockBatch[];
  onClose: () => void;
  onSave: (dist: Distribution) => void;
}

function DistributeModal({ open, denoms, batches, onClose, onSave }: DistributeModalProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [data, setData] = useState<Partial<Distribution>>({
    ...EMPTY_DIST,
    denominationId: denoms[0]?.id || "",
  });

  const upd = <K extends keyof Distribution>(f: K, v: Distribution[K]) => setData((d: Partial<Distribution>) => ({ ...d, [f]: v }));

  React.useEffect(() => {
    if (open) {
      setData({
        ...EMPTY_DIST,
        denominationId: denoms[0]?.id || "",
        issuedDate: new Date().toISOString().split("T")[0],
        issuedByUserId: authUser?.id || "",
      });
    }
  }, [open, denoms, authUser?.id]);

  const selectedDen = denoms.find((d) => d.id === data.denominationId);
  const availableBatches = batches.filter((b) => b.denominationId === data.denominationId && b.remaining > 0);
  const totalAvailable = availableBatches.reduce((s: number, b: StockBatch) => s + b.remaining, 0);

  const settings = getObject("hasanat_settings", DEFAULT_HASANAT_SETTINGS);
  const fields = settings.fields || DEFAULT_HASANAT_SETTINGS.fields || {};
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_HASANAT_SETTINGS.fieldOrder || [];

  const orderedFields = getSortedFields(
    DEFAULT_HASANAT_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields
  );

  const isValid = useMemo(() => {
    if (totalAvailable === 0) return false;
    for (const f of orderedFields) {
      const isEnabled = fields[f.id]?.enabled !== false;
      const isRequired = !!fields[f.id]?.required;
      if (!isEnabled || !isRequired) continue;
      if (f.id === "recipientName") {
        const recipientId = data.recipientType === "faculty"
          ? data.recipientTeacherId
          : data.recipientStudentId;
        if (!recipientId) return false;
        continue;
      }
      if (f.id === "issuedBy") {
        const actorId = data.issuedByUserId || "";
        if (!actorId) return false;
        continue;
      }
      const val = (data as Record<string, unknown>)[f.id];
      if (val === undefined || val === null || val === "") return false;
    }
    return true;
  }, [orderedFields, fields, data, totalAvailable]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Distribute Cards"
      icon={Star}
      cancelLabel="Cancel"
      saveLabel="Distribute"
      onSave={() => {
        const den = denoms.find((d) => d.id === data.denominationId);
        const batch = batches.find((b) => b.denominationId === data.denominationId && b.remaining > 0);
        const payload: Distribution = {
          ...data,
          id: `dist${Date.now()}`,
          denominationName: den?.name || "",
          batchId: batch?.id || "",
          status: "active",
          recipientName: "",
          issuedByUserId: data.issuedByUserId || authUser?.id || "",
        } as Distribution;
        if (data.recipientType === "faculty") {
          delete payload.recipientStudentId;
        } else {
          delete payload.recipientTeacherId;
        }
        onSave(payload);
      }}
      saveDisabled={!isValid}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderedFields.map((field) => {
              const isEnabled = fields[field.id]?.enabled !== false;
              if (!isEnabled) return null;

              if (field.id === "denominationId") {
                return (
                  <div key="denominationId" className="sm:col-span-2">
                    <label htmlFor="denom" className={FORM_LABEL}>Denomination *</label>
                    <select id="denom" className={FORM_INPUT + " cursor-pointer"} value={data.denominationId} onChange={(e) => upd("denominationId", e.target.value)}>
                      {denoms.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{d.icon} {d.name} ({d.points} pts)</option>)}
                    </select>
                    {selectedDen && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-8 flex-1 rounded-lg flex items-center gap-2 px-3 text-white text-xs font-semibold" style={{ background: selectedDen.color }}>
                          <span>{selectedDen.icon}</span><span>{selectedDen.name}</span>
                        </div>
                        <span className={`text-[11px] font-semibold ${totalAvailable === 0 ? "text-destructive" : "text-success"}`}>
                          {totalAvailable} available
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              if (field.id === "recipientType") {
                return (
                  <div key="recipientType" className="sm:col-span-2">
                    <label className={FORM_LABEL}>Recipient Type *</label>
                    <div className="flex gap-2">
                      {([
                        { id: "student" as const, label: "Student", icon: User },
                        { id: "faculty" as const, label: "Faculty", icon: Users2 }
                      ]).map((rt) => {
                        const Icon = rt.icon;
                        return (
                          <button
                            key={rt.id}
                            type="button"
                            aria-pressed={data.recipientType === rt.id}
                            onClick={() => setData((d) => ({
                              ...d,
                              recipientType: rt.id,
                              recipientStudentId: rt.id === "student" ? d.recipientStudentId : undefined,
                              recipientTeacherId: rt.id === "faculty" ? d.recipientTeacherId : undefined,
                            }))}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${data.recipientType === rt.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                          >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {rt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (field.id === "recipientName") {
                const recipientId = data.recipientType === "faculty"
                  ? (data.recipientTeacherId || "")
                  : (data.recipientStudentId || "");
                return (
                  <div key="recipientName">
                    <RegistryPersonSelect
                      id="hasanat-recipient"
                      kind={data.recipientType === "faculty" ? "teacher" : "student"}
                      label={t("hasanat.fieldRecipient")}
                      required
                      value={recipientId}
                      onChange={(id) => {
                        if (data.recipientType === "faculty") {
                          setData((d) => ({
                            ...d,
                            recipientTeacherId: id,
                            recipientStudentId: undefined,
                          }));
                        } else {
                          setData((d) => ({
                            ...d,
                            recipientStudentId: id,
                            recipientTeacherId: undefined,
                          }));
                        }
                      }}
                    />
                  </div>
                );
              }

              if (field.id === "recipientClass") {
                const isRequired = !!fields[field.id]?.required;
                return (
                  <div key="recipientClass">
                    <label htmlFor="recp-class" className={FORM_LABEL}>{data.recipientType === "student" ? "Class" : "Department"} {isRequired ? "*" : ""}</label>
                    <input id="recp-class" className={FORM_INPUT} value={data.recipientClass || ""} onChange={(e) => upd("recipientClass", e.target.value)} placeholder="e.g. Hifz A" required={isRequired} />
                  </div>
                );
              }

              if (field.id === "quantity") {
                return (
                  <div key="quantity">
                    <label htmlFor="qty" className={FORM_LABEL}>Quantity *</label>
                    <input id="qty" type="number" className={FORM_INPUT} value={data.quantity || 1} onChange={(e) => upd("quantity", Math.min(+e.target.value, totalAvailable))} min={1} max={totalAvailable} required />
                  </div>
                );
              }

              if (field.id === "issuedDate") {
                return (
                  <div key="issuedDate">
                    <label htmlFor="issue-date" className={FORM_LABEL}>Issued Date *</label>
                    <DatePicker
                      id="issue-date"
                      value={data.issuedDate || ""}
                      onChange={(val) => upd("issuedDate", val)}
                      required
                    />
                  </div>
                );
              }

              if (field.id === "reason") {
                return (
                  <div key="reason" className="sm:col-span-2">
                    <label htmlFor="reason" className={FORM_LABEL}>Reason / Achievement *</label>
                    <input id="reason" className={FORM_INPUT} value={data.reason || ""} onChange={(e) => upd("reason", e.target.value)} placeholder="e.g. Completed Juz 5" required />
                  </div>
                );
              }

              if (field.id === "issuedBy") {
                const isRequired = !!fields[field.id]?.required;
                return (
                  <div key="issuedBy" className="sm:col-span-2">
                    <UserActorSelect
                      id="issued-by"
                      label={t("hasanat.fieldIssuedBy")}
                      required={isRequired}
                      value={data.issuedByUserId || ""}
                      onChange={(id) => setData((d) => ({ ...d, issuedByUserId: id }))}
                    />
                  </div>
                );
              }

              // Custom Field
              const isCustom = !DEFAULT_HASANAT_FIELD_DEFS.some(df => df.id === field.id);
              if (isCustom) {
                const value = (data as any)[field.id] ?? "";
                return (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={FORM_LABEL}>
                      {field.label} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        className={FORM_INPUT + " min-h-[80px] py-2"}
                        value={value as string}
                        onChange={(e) => upd(field.id as any, e.target.value as any)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className={FORM_INPUT + " cursor-pointer"}
                        value={value as string}
                        onChange={(e) => upd(field.id as any, e.target.value as any)}
                        required={field.required}
                      >
                        <option value="">Select option…</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => upd(field.id as any, e.target.checked as any)}
                          className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-medium text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        className={FORM_INPUT}
                        value={value as number}
                        onChange={(e) => upd(field.id as any, e.target.value as any)}
                        placeholder={field.placeholder || `Enter number…`}
                        required={field.required}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        value={value as string}
                        onChange={(val) => upd(field.id as any, val as any)}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type="text"
                        className={FORM_INPUT}
                        value={value as string}
                        onChange={(e) => upd(field.id as any, e.target.value as any)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    )}
                  </div>
                );
              }

              return null;
            })}
      </div>
    </FormModal>
  );
}

export interface DistributionManagerProps {
  distributions: Distribution[];
  denoms: Denomination[];
  batches: StockBatch[];
  onUpdate: (dists: Distribution[]) => void;
}

/**
 * DistributionManager Component
 *
 * Renders the ledger interface for tracking physical reward cards distributed to students or faculty.
 * Enables searching and filtering distributions by keyword or status (e.g., active, redeemed, returned),
 * updating distribution statuses, and launching a modal to issue new cards to recipients.
 *
 * @param props - Component properties.
 * @returns React element representing the card distribution manager UI.
 */
export default function DistributionManager({ distributions, denoms, batches, onUpdate }: DistributionManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return distributions.filter((d) => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || (d.recipientName || "").toLowerCase().includes(q)
        || d.denominationName.toLowerCase().includes(q)
        || d.reason?.toLowerCase().includes(q);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(d.status);
      return matchSearch && matchStatus;
    });
  }, [distributions, search, filterStatus]);

  const toggleStatus = (s: string) => setFilterStatus((l) => l.includes(s) ? l.filter((x) => x !== s) : [...l, s]);

  const handleDistribute = (dist: Distribution) => {
    onUpdate([...distributions, dist]);
    setShowModal(false);
  };

  const changeStatus = (id: string, status: "active" | "redeemed" | "returned") => onUpdate(distributions.map((d) => d.id === id ? { ...d, status } : d));

  const getDen = (id: string) => denoms.find((d) => d.id === id);

  return (
    <section aria-label="Distribution Manager" className="space-y-4">
      <header className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="search-dist" className="sr-only">Search distributions</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input id="search-dist" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search distributions…" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3.5 h-3.5" aria-hidden="true" /></button>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Status <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(STATUS_CFG).map(([k, v]) => (
              <DropdownMenuCheckboxItem key={k} checked={filterStatus.includes(k)} onCheckedChange={() => toggleStatus(k)}>{v.label}</DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Distribute Cards
        </button>
      </header>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Distributions</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Card", "Recipient", "Class", "Qty", "Reason", "Issued", "By", "Status", ""].map((h) => (
                  <th scope="col" key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h === "" ? <span className="sr-only">Actions</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">No distributions found</td></tr>
              ) : (
                filtered.map((d, i) => {
                  const den = getDen(d.denominationId);
                  const sCfg = STATUS_CFG[d.status] || STATUS_CFG.active;
                  return (
                    <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">{den?.icon || "⭐"}</span>
                          <div>
                            <p className="text-[12px] font-semibold text-foreground whitespace-nowrap m-0">{d.denominationName}</p>
                            {den && <p className="text-[10px] font-bold m-0" style={{ color: den.color }}>{den.points} pts</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {d.recipientType === "faculty" ? <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> : <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
                          <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{d.recipientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{d.recipientClass || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold text-foreground">{d.quantity}</span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-[12px] text-muted-foreground truncate m-0">{d.reason}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{d.issuedDate}</td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{d.issuedBy || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sCfg.cls}`}>{sCfg.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" aria-label="Change status" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuLabel className="text-xs">Change Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {Object.entries(STATUS_CFG).map(([k, v]) => (
                                <DropdownMenuCheckboxItem key={k} checked={d.status === k} onCheckedChange={() => changeStatus(d.id, k as "active" | "redeemed" | "returned")}>{v.label}</DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DistributeModal
        open={showModal}
        denoms={denoms}
        batches={batches}
        onClose={() => setShowModal(false)}
        onSave={handleDistribute}
      />
    </section>
  );
}
