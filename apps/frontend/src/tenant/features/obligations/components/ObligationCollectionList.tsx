import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import { Trash2 } from "lucide-react";
import {
  ObligationCollection, ObligationType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import { useDebounce } from "@/hooks/useDebounce";
import { useMergedObligationContacts } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { BulkSelectionBar } from "@/components/ui/BulkSelectionBar";
import { BulkSelectionRestoreAction } from "@/components/ui/BulkSelectionActions";
import { Button } from "@/components/ui/button";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ObligationCollectionListContent } from "@/tenant/features/obligations/components/ObligationCollectionListContent";
import { ObligationCollectionListToolbar } from "@/tenant/features/obligations/components/ObligationCollectionListToolbar";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));

const ALWAYS_COLUMN_VISIBLE = (_key: string): boolean => true;

export interface ObligationCollectionListProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  onAddNew: () => void;
  onView: (collection: ObligationCollection) => void;
  onFilteredCountChange?: (count: number) => void;
  canWrite?: boolean;
  canDelete?: boolean;
  showDeleted?: boolean;
  onToggleShowDeleted?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  onBulkRestore?: (ids: string[]) => void | Promise<void>;
  isColumnVisible?: (key: string) => boolean;
  getColumnWidth?: (key: string) => number | undefined;
  onColumnResize?: (key: string, width: number) => void;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onMessage?: (channel: 'sms' | 'whatsapp' | 'email', collections: ObligationCollection[]) => void;
}

export function ObligationCollectionList({
  collections,
  obligationTypes,
  reps,
  mujtahids,
  onAddNew,
  onView,
  onFilteredCountChange,
  canWrite = true,
  canDelete = true,
  showDeleted = false,
  onToggleShowDeleted,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  isColumnVisible,
  getColumnWidth,
  onColumnResize,
  columnCustomizer,
  onMessage,
}: ObligationCollectionListProps) {
  const { t } = useTranslation();
  const { viewMode, setViewMode } = useWorkDirectoryViewMode();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [printCollection, setPrintCollection] = useState<ObligationCollection | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const debouncedSearch = useDebounce(search, 300);
  const senderIds = useMemo(() => collections.map((collection) => collection.sender_id), [collections]);
  const contacts = useMergedObligationContacts(senderIds);

  useEffect(() => {
    setSelectedIds([]);
  }, [showDeleted]);

  const getContact = useCallback((contactId?: string | number | null) => contacts.find((contact) => String(contact.id) === String(contactId)), [contacts]);
  const getRep = (repId: string) => reps.find((rep) => rep.id === repId);
  const getMujtahid = (repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahids.find((mujtahid) => mujtahid.id === rep.mujtahid_id) : null;
  };
  const getObType = (obligationTypeId: string) => obligationTypes.find((obligationType) => obligationType.id === obligationTypeId);

  const filtered = useMemo(() => collections.filter((collection) => {
    if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
    if (debouncedSearch) {
      const searchQuery = debouncedSearch.toLowerCase();
      const sender = getContact(collection.sender_id)?.name?.toLowerCase() || "";
      const receipt = collection.receipt_no.toLowerCase();
      if (!sender.includes(searchQuery) && !receipt.includes(searchQuery)) return false;
    }
    return true;
  }), [collections, debouncedSearch, typeFilter, getContact]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const paymentModeConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
    Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
  }), [t]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((collection) => selectedIds.includes(collection.id));

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) return;
    if (showDeleted) {
      if (!confirm(t("obligations.trash.bulkRestoreConfirm", { count: selectedIds.length }))) return;
      await onBulkRestore?.(selectedIds);
    } else {
      if (!confirm(t("obligations.trash.bulkDeleteConfirm", { count: selectedIds.length }))) return;
      await onBulkDelete?.(selectedIds);
    }
    setSelectedIds([]);
  };

  return (
    <div className="space-y-4">
      {canDelete && (
        <BulkSelectionBar
          placement="floating"
          selectedCount={selectedIds.length}
          countLabel={t("obligations.trash.selected", { count: selectedIds.length })}
        >
          {showDeleted ? (
            <BulkSelectionRestoreAction
              label={t("obligations.trash.restore")}
              onClick={() => { void handleBulkAction(); }}
            />
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => { void handleBulkAction(); }}
              className="flex min-h-11 items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.delete")}
            </Button>
          )}
        </BulkSelectionBar>
      )}

      <ObligationCollectionListToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        typeFilter={typeFilter}
        obligationTypes={obligationTypes}
        canDelete={canDelete}
        showDeleted={showDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onTypeFilterChange={setTypeFilter}
        onToggleShowDeleted={onToggleShowDeleted}
      />

      <ObligationCollectionListContent
        viewMode={viewMode}
        collections={filtered}
        search={search}
        typeFilter={typeFilter}
        selectedIds={selectedIds}
        isColumnVisible={columnVisible}
        allFilteredSelected={allFilteredSelected}
        canWrite={canWrite}
        canDelete={canDelete}
        showDeleted={showDeleted}
        paymentModeConfig={paymentModeConfig}
        getContact={getContact}
        getRep={getRep}
        getMujtahid={getMujtahid}
        getObligationType={getObType}
        getColumnWidth={getColumnWidth}
        onColumnResize={onColumnResize}
        onAddNew={onAddNew}
        onView={onView}
        onPrint={setPrintCollection}
        onSelectAll={(checked) => setSelectedIds(checked ? filtered.map((collection) => collection.id) : [])}
        onToggleSelected={(id, checked) => {
          setSelectedIds((currentSelectedIds) =>
            checked
              ? [...currentSelectedIds, id]
              : currentSelectedIds.filter((selectedId) => selectedId !== id),
          );
        }}
        onDelete={onDelete}
        onRestore={onRestore}
        onMessage={onMessage}
      />

      {printCollection && (
        <Suspense fallback={null}>
          <PrintInvoiceModal
            collection={printCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => setPrintCollection(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
