import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Plus, Search, X, Star, User, Users2, Filter, ChevronDown, Eye, Trash2, RotateCcw } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Distribution, Denomination, StockBatch } from '@/lib/data/hasanatData';
import { useHasanatConfig } from "@/hooks/useStandardModuleConfig";
import {
  DEFAULT_HASANAT_FIELD_DEFS,
  todayISO,
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
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";


const EMPTY_DIST: Partial<Distribution> = {
  denominationId: "",
  recipientType: "student",
  recipientStudentId: "",
  recipientTeacherId: "",
  recipientClass: "",
  quantity: 1,
  reason: "",
  issuedDate: todayISO(),
  issuedByUserId: "",
};

interface DistributeModalProps {
  open: boolean;
  denoms: Denomination[];
  batches: StockBatch[];
  onClose: () => void;
  onSave: (dist: Distribution) => void | Promise<void>;
}

function DistributeModal({ open, denoms, batches, onClose, onSave }: DistributeModalProps) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
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
        issuedDate: todayISO(),
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
  }, [orderedFields, data, totalAvailable, isFieldEnabled, isFieldRequired]);

  const getCustomFieldPlaceholder = (fieldLabel: string): string => t("hasanat.form.enterField", { field: fieldLabel.toLowerCase() });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("hasanat.distributeCards")}
      icon={Star}
      cancelLabel={t("common.cancel")}
      saveLabel={t("hasanat.form.distributeAction")}
      saving={submitting}
      onSave={() => {
        void (async () => {
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
        setSubmitting(true);
        try {
          await onSave(payload);
        } finally {
          setSubmitting(false);
        }
        })();
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
                    <label htmlFor="denom" className={FORM_LABEL}>{t("hasanat.form.denomination")} *</label>
                    <FormSelect
                      id="denom"
                      value={data.denominationId || ""}
                      onChange={(value) => updateField("denominationId", value)}
                      options={denoms.filter((denomination) => denomination.active).map((denomination) => ({
                        value: denomination.id,
                        label: `${denomination.icon} ${denomination.name} (${t("hasanat.form.pointsShort", { points: denomination.points })})`
                      }))}
                    />
                    {selectedDenomination && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-8 flex-1 rounded-lg flex items-center gap-2 px-3 text-white text-xs font-semibold" style={{ background: selectedDenomination.color }}>
                          <span>{selectedDenomination.icon}</span><span>{selectedDenomination.name}</span>
                        </div>
                        <span className={`text-xs font-semibold ${totalAvailable === 0 ? "text-destructive" : "text-success"}`}>
                          {t("hasanat.form.availableCount", { count: totalAvailable })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              if (field.id === "recipientType") {
                return (
                  <div key="recipientType" className="sm:col-span-2">
                    <label className={FORM_LABEL}>{t("hasanat.form.recipientType")} *</label>
                    <div className="flex gap-2">
                      {([
                        { id: "student" as const, label: t("hasanat.form.recipientType.student"), icon: User },
                        { id: "faculty" as const, label: t("hasanat.form.recipientType.faculty"), icon: Users2 }
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
                            className={`flex-1 min-h-11 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm font-medium transition-colors ${data.recipientType === recipientTypeOption.id ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
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
                    <label htmlFor="recp-class" className={FORM_LABEL}>{data.recipientType === "student" ? t("hasanat.form.classLabel") : t("hasanat.form.departmentLabel")} {isRequired ? "*" : ""}</label>
                    <Input id="recp-class" className={FORM_INPUT} value={data.recipientClass || ""} onChange={(event) => updateField("recipientClass", event.target.value)} placeholder={t("hasanat.form.recipientClassPlaceholder")} required={isRequired} />
                  </div>
                );
              }

              if (field.id === "quantity") {
                return (
                  <div key="quantity">
                    <label htmlFor="qty" className={FORM_LABEL}>{t("hasanat.form.quantity")} *</label>
                    <Input id="qty" type="number" className={FORM_INPUT} value={data.quantity || 1} onChange={(event) => updateField("quantity", Math.min(+event.target.value, totalAvailable))} min={1} max={totalAvailable} required />
                  </div>
                );
              }

              if (field.id === "issuedDate") {
                return (
                  <div key="issuedDate">
                    <label htmlFor="issue-date" className={FORM_LABEL}>{t("hasanat.form.issuedDate")} *</label>
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
                    <label htmlFor="reason" className={FORM_LABEL}>{t("hasanat.form.reason")} *</label>
                    <Input id="reason" className={FORM_INPUT} value={data.reason || ""} onChange={(event) => updateField("reason", event.target.value)} placeholder={t("hasanat.form.reasonPlaceholder")} required />
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
                        placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      <FormSelect
                        value={fieldValue as string}
                        onChange={(value) => updateField(field.id, value)}
                        placeholder={t("hasanat.form.selectOption")}
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
                        placeholder={field.placeholder || t("hasanat.form.enterNumber")}
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
                        placeholder={field.placeholder || getCustomFieldPlaceholder(field.label)}
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
  onUpdate: (dists: Distribution[]) => void | Promise<void>;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  createRequestKey?: number;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', distributions: Distribution[]) => void;
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
  canWrite = true,
  canDelete = false,
  showDeleted = false,
  createRequestKey = 0,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  useEffect(() => {
    if (createRequestKey > 0 && canWrite && !showDeleted) {
      setShowModal(true);
    }
  }, [createRequestKey, canWrite, showDeleted]);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const showCard = isColumnVisible ? isColumnVisible("card") : true;
  const showRecipient = isColumnVisible ? isColumnVisible("recipient") : true;
  const showRecipientClass = isColumnVisible ? isColumnVisible("recipientClass") : true;
  const showQuantity = isColumnVisible ? isColumnVisible("quantity") : true;
  const showReason = isColumnVisible ? isColumnVisible("reason") : true;
  const showIssuedDate = isColumnVisible ? isColumnVisible("issuedDate") : true;
  const showIssuedBy = isColumnVisible ? isColumnVisible("issuedBy") : true;
  const showStatus = isColumnVisible ? isColumnVisible("status") : true;

  const toggleStatus = (status: string) => setFilterStatus((selectedStatuses) => selectedStatuses.includes(status) ? selectedStatuses.filter((selectedStatus) => selectedStatus !== status) : [...selectedStatuses, status]);

  const handleDistribute = async (dist: Distribution) => {
    await onUpdate([...distributions, dist]);
    setShowModal(false);
  };

  const changeStatus = (id: string, status: "active" | "redeemed" | "returned") => {
    void onUpdate(distributions.map((distribution) => distribution.id === id ? { ...distribution, status } : distribution));
  };

  const handleRowTrashAction = async (id: string) => {
    if (showDeleted) {
      if (!confirm(t("hasanat.trash.bulkRestoreConfirm", { count: 1 }))) return;
      await onRestore?.(id);
      return;
    }
    if (!confirm(t("hasanat.trash.deleteConfirm"))) return;
    await onDelete?.(id);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((distribution) => selectedIds.includes(distribution.id));

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("hasanat.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("hasanat.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  const getDenomination = (id: string) => denoms.find((denomination) => denomination.id === id);

  return (
    <section aria-label={t("hasanat.distribution.aria")} className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="search-dist" className="sr-only">{t("hasanat.distribution.searchLabel")}</label>
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input id="search-dist" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("hasanat.searchDistributions")} className="w-full ps-10 pe-11 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
          {search && <Button variant="ghost" type="button" size="icon" aria-label={t("common.clearSearch")} onClick={() => setSearch("")} className="absolute end-1 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="w-3.5 h-3.5" aria-hidden="true" /></Button>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.status")} <ChevronDown className="w-3 h-3" aria-hidden="true" />
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
        {canDelete && selectedIds.length > 0 && (
          <Button
            type="button"
            variant={showDeleted ? "outline" : "destructive"}
            onClick={() => { void handleBulkAction(); }}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
            {showDeleted ? t("hasanat.trash.restore") : t("common.delete")} ({selectedIds.length})
          </Button>
        )}
        {canWrite && !showDeleted && (
          <Button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.distributeCards")}
          </Button>
        )}
        </div>
      </header>

      <Card accentColor="primary" className="shadow-sm hover:shadow-md border-border/80 p-0 overflow-hidden bg-card/45 backdrop-blur-sm">
        <div className="space-y-3 p-3 md:hidden">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</p>
          ) : (
            filtered.map((distribution, index) => {
              const denomination = getDenomination(distribution.denominationId);
              return (
                <motion.article
                  key={distribution.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="space-y-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      {showRecipient && (
                        <div className="flex items-center gap-1.5">
                          {distribution.recipientType === "faculty"
                            ? <Users2 className="w-3 h-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                            : <User className="w-3 h-3 shrink-0 text-muted-foreground" aria-hidden="true" />}
                          <h4 className="truncate text-sm font-semibold text-foreground">{distribution.recipientName}</h4>
                        </div>
                      )}
                      {showCard && (
                        <div className={`flex items-center gap-2 ${showRecipient ? "mt-1" : ""}`}>
                          <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                          <div className="min-w-0">
                            {!showRecipient && (
                              <h4 className="truncate text-sm font-semibold text-foreground">{distribution.denominationName}</h4>
                            )}
                            {showRecipient && (
                              <p className="truncate text-xs text-muted-foreground">{distribution.denominationName}</p>
                            )}
                            {denomination && (
                              <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>
                                {t("hasanat.form.pointsShort", { points: denomination.points })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {showStatus && (
                      <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                    )}
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    {showRecipientClass && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.recipientClass")}</dt>
                        <dd className="text-foreground">{distribution.recipientClass || "—"}</dd>
                      </div>
                    )}
                    {showQuantity && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.quantity")}</dt>
                        <dd className="font-bold text-foreground">{distribution.quantity}</dd>
                      </div>
                    )}
                    {showReason && (
                      <div className={showRecipientClass || showQuantity ? "" : "sm:col-span-2"}>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.reason")}</dt>
                        <dd className="break-words text-foreground">{distribution.reason || "—"}</dd>
                      </div>
                    )}
                    {showIssuedDate && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.issuedDate")}</dt>
                        <dd className="text-foreground">{distribution.issuedDate}</dd>
                      </div>
                    )}
                    {showIssuedBy && (
                      <div>
                        <dt className="text-xs font-semibold text-muted-foreground">{t("hasanat.columns.distribution.issuedBy")}</dt>
                        <dd className="break-words text-foreground">{distribution.issuedBy || "—"}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
                    {canDelete ? (
                      <Checkbox
                        checked={selectedIds.includes(distribution.id)}
                        onCheckedChange={() => toggleSelected(distribution.id)}
                        aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                      />
                    ) : (
                      <span />
                    )}
                    <div className="flex flex-wrap items-center gap-1">
                      {(canWrite || onMessage) && !showDeleted && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" type="button" size="icon" aria-label={t("hasanat.changeStatus")} className="rounded-lg hover:bg-muted text-muted-foreground">
                              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {canWrite && (
                              <>
                                <DropdownMenuLabel className="text-xs">{t("hasanat.changeStatus")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                  value={distribution.status}
                                  onValueChange={(status) =>
                                    changeStatus(distribution.id, status as "active" | "redeemed" | "returned")
                                  }
                                >
                                  {Object.keys(statusConfig).map((status) => (
                                    <DropdownMenuRadioItem key={status} value={status}>
                                      {statusLabels[status as keyof typeof statusLabels]}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </>
                            )}
                            {onMessage && (
                              <>
                                {canWrite && <DropdownMenuSeparator />}
                                <DropdownMenuLabel className="text-xs">{t("messaging.channel")}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onMessage("whatsapp", [distribution])}>
                                  {t("messaging.channel.whatsapp")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onMessage("sms", [distribution])}>
                                  {t("messaging.channel.sms")}
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {canDelete && (showDeleted ? onRestore : onDelete) && (
                        <Button
                          variant="ghost"
                          type="button"
                          size="icon"
                          className="rounded-lg hover:bg-muted text-muted-foreground"
                          onClick={() => { void handleRowTrashAction(distribution.id); }}
                          aria-label={showDeleted ? t("hasanat.trash.restore") : t("common.delete")}
                        >
                          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm table-fixed">
            <caption className="sr-only">{t("hasanat.distribution.aria")}</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {canDelete && (
                  <th scope="col" className="px-3 py-2.5 w-10">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedIds(filtered.map((distribution) => distribution.id));
                        else setSelectedIds([]);
                      }}
                      aria-label={t("hasanat.trash.selectAll")}
                    />
                  </th>
                )}
                {showCard && (
                  <ResizableTableHead columnKey="card" width={getColumnWidth?.("card")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.card")}
                  </ResizableTableHead>
                )}
                {showRecipient && (
                  <ResizableTableHead columnKey="recipient" width={getColumnWidth?.("recipient")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.recipient")}
                  </ResizableTableHead>
                )}
                {showRecipientClass && (
                  <ResizableTableHead columnKey="recipientClass" width={getColumnWidth?.("recipientClass")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.recipientClass")}
                  </ResizableTableHead>
                )}
                {showQuantity && (
                  <ResizableTableHead columnKey="quantity" width={getColumnWidth?.("quantity")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.quantity")}
                  </ResizableTableHead>
                )}
                {showReason && (
                  <ResizableTableHead columnKey="reason" width={getColumnWidth?.("reason")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.reason")}
                  </ResizableTableHead>
                )}
                {showIssuedDate && (
                  <ResizableTableHead columnKey="issuedDate" width={getColumnWidth?.("issuedDate")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.issuedDate")}
                  </ResizableTableHead>
                )}
                {showIssuedBy && (
                  <ResizableTableHead columnKey="issuedBy" width={getColumnWidth?.("issuedBy")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.issuedBy")}
                  </ResizableTableHead>
                )}
                {showStatus && (
                  <ResizableTableHead columnKey="status" width={getColumnWidth?.("status")} onResize={onColumnResize} className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {t("hasanat.columns.distribution.status")}
                  </ResizableTableHead>
                )}
                <th scope="col" className="px-4 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  <span className="sr-only">{t("hasanat.columns.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr><td colSpan={canDelete ? 10 : 9} className="py-10 text-center text-sm text-muted-foreground">{t("hasanat.empty.distributions")}</td></tr>
              ) : (
                filtered.map((distribution, index) => {
                  const denomination = getDenomination(distribution.denominationId);
                  return (
                    <motion.tr key={distribution.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="hover:bg-muted/20 transition-colors group">
                      {canDelete && (
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedIds.includes(distribution.id)}
                            onCheckedChange={() => toggleSelected(distribution.id)}
                            aria-label={t("hasanat.trash.selectDistribution", { name: distribution.recipientName || distribution.id })}
                          />
                        </td>
                      )}
                      {showCard && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base" aria-hidden="true">{denomination?.icon || "⭐"}</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground whitespace-nowrap m-0">{distribution.denominationName}</p>
                              {denomination && <p className="text-xs font-bold m-0" style={{ color: denomination.color }}>{denomination.points} pts</p>}
                            </div>
                          </div>
                        </td>
                      )}
                      {showRecipient && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {distribution.recipientType === "faculty" ? <Users2 className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> : <User className="w-3 h-3 text-muted-foreground" aria-hidden="true" />}
                            <span className="text-sm font-semibold text-foreground whitespace-nowrap">{distribution.recipientName}</span>
                          </div>
                        </td>
                      )}
                      {showRecipientClass && (
                        <td className="px-4 py-3 text-sm text-muted-foreground">{distribution.recipientClass || "—"}</td>
                      )}
                      {showQuantity && (
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-foreground">{distribution.quantity}</span>
                        </td>
                      )}
                      {showReason && (
                        <td className="px-4 py-3 max-w-[10rem]">
                          <p className="text-sm text-muted-foreground truncate m-0">{distribution.reason}</p>
                        </td>
                      )}
                      {showIssuedDate && (
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{distribution.issuedDate}</td>
                      )}
                      {showIssuedBy && (
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{distribution.issuedBy || "—"}</td>
                      )}
                      {showStatus && (
                        <td className="px-4 py-3">
                          <StatusBadge status={distribution.status} config={statusConfig} size="sm" />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity flex items-center justify-end gap-1">
                          {(canWrite || onMessage) && !showDeleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" type="button" size="icon" aria-label={t("hasanat.changeStatus")} className="rounded-lg hover:bg-muted text-muted-foreground">
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {canWrite && (
                                <>
                                  <DropdownMenuLabel className="text-xs">{t("hasanat.changeStatus")}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuRadioGroup
                                    value={distribution.status}
                                    onValueChange={(status) =>
                                      changeStatus(distribution.id, status as "active" | "redeemed" | "returned")
                                    }
                                  >
                                    {Object.keys(statusConfig).map((status) => (
                                      <DropdownMenuRadioItem key={status} value={status}>
                                        {statusLabels[status as keyof typeof statusLabels]}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </>
                              )}
                              {onMessage && (
                                <>
                                  {canWrite && <DropdownMenuSeparator />}
                                  <DropdownMenuLabel className="text-xs">{t("messaging.channel")}</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => onMessage('whatsapp', [distribution])}>
                                    {t("messaging.channel.whatsapp")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onMessage('sms', [distribution])}>
                                    {t("messaging.channel.sms")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          )}
                          {canDelete && (showDeleted ? onRestore : onDelete) && (
                            <Button
                              variant="ghost"
                              type="button"
                              size="icon"
                              className="rounded-lg hover:bg-muted text-muted-foreground"
                              onClick={() => { void handleRowTrashAction(distribution.id); }}
                              aria-label={showDeleted ? t("hasanat.trash.restore") : t("common.delete")}
                            >
                              {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
                            </Button>
                          )}
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

      {canWrite && !showDeleted && (
        <DistributeModal
          open={showModal}
          denoms={denoms}
          batches={batches}
          onClose={() => setShowModal(false)}
          onSave={handleDistribute}
        />
      )}
    </section>
  );
}
