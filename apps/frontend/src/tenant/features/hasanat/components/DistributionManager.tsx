import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus, Search, X, Star, User, Users2, Filter, ChevronDown, Eye } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Distribution, Denomination, StockBatch } from '@/lib/data/hasanatData';
import { useHasanatConfig } from "@/tenant/features/hasanat/hooks/useHasanatConfig";
import {
  DEFAULT_HASANAT_FIELD_DEFS,
} from "@mms/shared";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { RegistryPersonSelect } from "@/components/ui/RegistryPersonSelect";
import { UserActorSelect } from "@/components/ui/UserActorSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";


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

  const updateField = (field: string, value: unknown) =>
    setData((previousData: Partial<Distribution>) => ({ ...previousData, [field]: value } as Partial<Distribution>));

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

  const selectedDenomination = denoms.find((denomination) => denomination.id === data.denominationId);
  const availableBatches = batches.filter((batch) => batch.denominationId === data.denominationId && batch.remaining > 0);
  const totalAvailable = availableBatches.reduce((sum: number, batch: StockBatch) => sum + batch.remaining, 0);

  const { fields, orderedFields, isFieldEnabled, isFieldRequired } = useHasanatConfig();

  const isValid = useMemo(() => {
    if (totalAvailable === 0) return false;
    for (const field of orderedFields) {
      const isEnabled = isFieldEnabled(field.id);
      const isRequired = isFieldRequired(field.id);
      if (!isEnabled || !isRequired) continue;
      if (field.id === "recipientName") {
        const recipientId = data.recipientType === "faculty"
          ? data.recipientTeacherId
          : data.recipientStudentId;
        if (!recipientId) return false;
        continue;
      }
      if (field.id === "issuedBy") {
        const actorId = data.issuedByUserId || "";
        if (!actorId) return false;
        continue;
      }
      const fieldValue = (data as Record<string, unknown>)[field.id];
      if (fieldValue === undefined || fieldValue === null || fieldValue === "") return false;
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
        const denomination = denoms.find((candidate) => candidate.id === data.denominationId);
        const batch = batches.find((candidate) => candidate.denominationId === data.denominationId && candidate.remaining > 0);
        const payload: Distribution = {
          ...data,
          id: `dist${Date.now()}`,
          denominationName: denomination?.name || "",
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
              const isEnabled = isFieldEnabled(field.id);
              if (!isEnabled) return null;

              if (field.id === "denominationId") {
                return (
                  <div key="denominationId" className="sm:col-span-2">
                    <label htmlFor="denom" className={FORM_LABEL}>Denomination *</label>
                    <FormSelect
                      id="denom"
                      value={data.denominationId || ""}
                      onChange={(value) => updateField("denominationId", value)}
                      options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
                        value: denomination.id,
                        label: `${denomination.icon} ${denomination.name} (${denomination.points} pts)`
                      }))}
                    />
                    {selectedDenomination && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-8 flex-1 rounded-lg flex items-center gap-2 px-3 text-white text-xs font-semibold" style={{ background: selectedDenomination.color }}>
                          <span>{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
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
                      ]).map((recipientTypeOption) => {
                        const Icon = recipientTypeOption.icon;
                        return (
                          <Button
                            key={recipientTypeOption.id}
                            type="button"
                            aria-pressed={data.recipientType === recipientTypeOption.id}
                            onClick={() => setData((previousData) => ({
                              ...previousData,
                              recipientType: recipientTypeOption.id,
                              recipientStudentId: recipientTypeOption.id === "student" ? previousData.recipientStudentId : undefined,
                              recipientTeacherId: recipientTypeOption.id === "faculty" ? previousData.recipientTeacherId : undefined,
                            }))}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${data.recipientType === recipientTypeOption.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
                          >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {recipientTypeOption.label}
                          </Button>
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
                          setData((previousData) => ({
                            ...previousData,
                            recipientTeacherId: id,
                            recipientStudentId: undefined,
                          }));
                        } else {
                          setData((previousData) => ({
                            ...previousData,
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
                    <Input id="recp-class" className={FORM_INPUT} value={data.recipientClass || ""} onChange={(event) => updateField("recipientClass", event.target.value)} placeholder="e.g. Hifz A" required={isRequired} />
                  </div>
                );
              }

              if (field.id === "quantity") {
                return (
                  <div key="quantity">
                    <label htmlFor="qty" className={FORM_LABEL}>Quantity *</label>
                    <Input id="qty" type="number" className={FORM_INPUT} value={data.quantity || 1} onChange={(event) => updateField("quantity", Math.min(+event.target.value, totalAvailable))} min={1} max={totalAvailable} required />
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
                      onChange={(value) => updateField("issuedDate", value)}
                      required
                    />
                  </div>
                );
              }

              if (field.id === "reason") {
                return (
                  <div key="reason" className="sm:col-span-2">
                    <label htmlFor="reason" className={FORM_LABEL}>Reason / Achievement *</label>
                    <Input id="reason" className={FORM_INPUT} value={data.reason || ""} onChange={(event) => updateField("reason", event.target.value)} placeholder="e.g. Completed Juz 5" required />
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
                      onChange={(id) => setData((previousData) => ({ ...previousData, issuedByUserId: id }))}
                    />
                  </div>
                );
              }

              // Custom Field
              const isCustom = !DEFAULT_HASANAT_FIELD_DEFS.some((defaultField) => defaultField.id === field.id);
              if (isCustom) {
                const fieldValue = (data as unknown as Record<string, unknown>)[field.id] ?? "";
                return (
                  <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                    <label className={FORM_LABEL}>
                      {field.label} {field.required ? "*" : ""}
                    </label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={`custom-${field.id}`}
                        name={field.id}
                        value={fieldValue as string}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}…`}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <FormSelect
                        value={fieldValue as string}
                        onChange={(value) => updateField(field.id, value)}
                        placeholder="Select option…"
                        options={field.options || []}
                      />
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                        <Checkbox
                          checked={!!fieldValue}
                          onCheckedChange={(checked) => updateField(field.id, !!checked)}
                        />
                        <span className="text-xs font-medium text-foreground">{field.label}</span>
                      </label>
                    ) : field.type === "number" ? (
                      <Input
                        type="number"
                        className={FORM_INPUT}
                        value={fieldValue as string | number}
                        onChange={(event) => updateField(field.id, event.target.value)}
                        placeholder={field.placeholder || `Enter number…`}
                        required={field.required}
                      />
                    ) : field.type === "date" ? (
                      <DatePicker
                        value={fieldValue as string}
                        onChange={(value) => updateField(field.id, value)}
                        required={field.required}
                      />
                    ) : (
                      <Input
                        type="text"
                        className={FORM_INPUT}
                        value={fieldValue as string}
                        onChange={(event) => updateField(field.id, event.target.value)}
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
  onFilteredCountChange?: (count: number) => void;
  isColumnVisible?: (key: string) => boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
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
export function DistributionManager({
  distributions,
  denoms,
  batches,
  onUpdate,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: DistributionManagerProps) {
  const { t } = useTranslation();
  const statusLabels = useMemo(
    () => ({
      active: t('hasanat.status.active'),
      redeemed: t('hasanat.status.redeemed'),
      returned: t('hasanat.status.returned'),
    }),
    [t],
  );
  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active:   { label: statusLabels.active,   cls: SEMANTIC_BADGE.info },
    redeemed: { label: statusLabels.redeemed, cls: 'bg-primary/10 text-primary border-primary/20' },
    returned: { label: statusLabels.returned, cls: SEMANTIC_BADGE.muted },
  }), [statusLabels]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return distributions.filter((distribution) => {
      const query = search.toLowerCase();
      const matchSearch = !query
        || (distribution.recipientName || "").toLowerCase().includes(query)
        || distribution.denominationName.toLowerCase().includes(query)
        || distribution.reason?.toLowerCase().includes(query);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(distribution.status);
      return matchSearch && matchStatus;
    });
  }, [distributions, search, filterStatus]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const showCard = isColumnVisible ? isColumnVisible("card") : true;
  const showRecipient = isColumnVisible ? isColumnVisible("recipient") : true;
  const showRecipientClass = isColumnVisible ? isColumnVisible("recipientClass") : true;
  const showQuantity = isColumnVisible ? isColumnVisible("quantity") : true;
  const showReason = isColumnVisible ? isColumnVisible("reason") : true;
  const showIssuedDate = isColumnVisible ? isColumnVisible("issuedDate") : true;
  const showIssuedBy = isColumnVisible ? isColumnVisible("issuedBy") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;

  const toggleStatus = (status: string) => setFilterStatus((selectedStatuses) => selectedStatuses.includes(status) ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status) : [...selectedStatuses, status]);

  const handleDistribute = (dist: Distribution) => {
    onUpdate([...distributions, dist]);
    setShowModal(false);
  };

  const changeStatus = (id: string, status: "active" | "redeemed" | "returned") => onUpdate(distributions.map((distribution) => distribution.id === id ? { ...distribution, status } : distribution));

  const getDenomination = (id: string) => denoms.find((denomination) => denomination.id === id);

  return (
    <section aria-label="Distribution Manager" className="space-y-4">
      <header className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="search-dist" className="sr-only">Search distributions</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input id="search-dist" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("hasanat.searchDistributions")} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {search && <Button variant="ghost" type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3.5 h-3.5" aria-hidden="true" /></Button>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Status <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("hasanat.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(statusConfig).map((status) => (
              <DropdownMenuCheckboxItem key={status} checked={filterStatus.includes(status)} onCheckedChange={() => toggleStatus(status)}>
                {statusLabels[status as keyof typeof statusLabels]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        <Button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.distributeCards")}
        </Button>
      </header>

      <Card accentColor="primary" className="shadow-sm hover:shadow-md border-border/80 p-0 overflow-hidden bg-card/45 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Distributions</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {showCard && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.card")}
                  </th>
                )}
                {showRecipient && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.recipient")}
                  </th>
                )}
                {showRecipientClass && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.recipientClass")}
                  </th>
                )}
                {showQuantity && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.quantity")}
                  </th>
                )}
                {showReason && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.reason")}
                  </th>
                )}
                {showIssuedDate && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.issuedDate")}
                  </th>
                )}
                {showIssuedBy && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.issuedBy")}
                  </th>
                )}
                {showStatus && (
                  <th scope="col" className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.status")}
                  </th>
                )}
                <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  <span className="sr-only">{t("hasanat.columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-10 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</td></tr>
              ) : (
                filtered.map((distribution, index) => {
                  const denomination = getDenomination(distribution.denominationId);
                  return (
                    <motion.tr key={distribution.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                      {showCard && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                            <div>
                              <p className="text-[12px] font-semibold text-foreground whitespace-nowrap m-0">{distribution.denominationName}</p>
                              {denomination && <p className="text-[10px] font-bold m-0" style={{ color: denomination.color }}>{denomination.points} pts</p>}
                            </div>
                          </div>
                        </td>
                      )}
                      {showRecipient && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {distribution.recipientType === "faculty" ? <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> : <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
                            <span className="text-[13px] font-semibold text-foreground whitespace-nowrap">{distribution.recipientName}</span>
                          </div>
                        </td>
                      )}
                      {showRecipientClass && (
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{distribution.recipientClass || "—"}</td>
                      )}
                      {showQuantity && (
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-bold text-foreground">{distribution.quantity}</span>
                        </td>
                      )}
                      {showReason && (
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="text-[12px] text-muted-foreground truncate m-0">{distribution.reason}</p>
                        </td>
                      )}
                      {showIssuedDate && (
                        <td className="px-4 py-3 text-[11px] text-muted-foreground whitespace-nowrap">{distribution.issuedDate}</td>
                      )}
                      {showIssuedBy && (
                        <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{distribution.issuedBy || "—"}</td>
                      )}
                      {showStatus && (
                        <td className="px-4 py-3">
                          <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" type="button" aria-label="Change status" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuLabel className="text-xs">{t("hasanat.changeStatus")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {Object.keys(statusConfig).map((status) => (
                                <DropdownMenuCheckboxItem key={status} checked={distribution.status === status} onCheckedChange={() => changeStatus(distribution.id, status as "active" | "redeemed" | "returned")}>
                                  {statusLabels[status as keyof typeof statusLabels]}
                                </DropdownMenuCheckboxItem>
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
      </Card>

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
