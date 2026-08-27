import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from "react";
import {
  ObligationCollection, ObligationType, MujtahidRep, Mujtahid
} from '@/lib/data/obligationsData';
import { useDebounce } from "@/hooks/useDebounce";
import { useMergedObligationContacts } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ObligationCollectionsListContent } from "@/tenant/features/obligations/components/ObligationCollectionsListContent";
import { ObligationCollectionsListFilters } from "@/tenant/features/obligations/components/ObligationCollectionsListFilters";
import { ObligationsBulkActionBar } from "@/tenant/features/obligations/components/ObligationsBulkActionBar";
import { useObligationSelection } from "@/tenant/features/obligations/hooks/useObligationSelection";

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

export function ObligationCollectionsList({
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
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const senderIds = useMemo(() => collections.map((collection) => collection.sender_id), [collections]);
  const contacts = useMergedObligationContacts(senderIds);

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

  const {
    selectedIds,
    setSelectedIds,
    allVisibleSelected,
    someVisibleSelected,
    toggleSelectAll,
    toggleSelectedCollection,
    clearSelection,
  } = useObligationSelection(filtered);

  useEffect(() => {
    clearSelection();
  }, [showDeleted, clearSelection]);

  const confirmRowTrash = (): void => {
    if (!pendingTrashId) return;
    void onDelete?.(pendingTrashId);
    setPendingTrashId(null);
  };

  const confirmBulkTrash = (): void => {
    if (showDeleted) void onBulkRestore?.(selectedIds);
    else void onBulkDelete?.(selectedIds);
    setSelectedIds([]);
    setConfirmBulkOpen(false);
  };

  const canBulkTrash = canDelete && Boolean(showDeleted ? onBulkRestore : onBulkDelete);

  return (
    <div className="space-y-4">
      <ObligationCollectionsListFilters
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        typeFilter={typeFilter}
        obligationTypes={obligationTypes}
        canDelete={canDelete}
        showDeleted={showDeleted}
        onToggleDeleted={onToggleShowDeleted}
        columnCustomizer={columnCustomizer}
        onSearchChange={setSearch}
        onTypeFilterChange={setTypeFilter}
      />

      {canBulkTrash && (
        <ObligationsBulkActionBar
          selectedCount={selectedIds.length}
          showDeleted={showDeleted}
          canDelete={canDelete}
          onRequestBulkDelete={() => setConfirmBulkOpen(true)}
          onRequestBulkRestore={() => setConfirmBulkOpen(true)}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      <ObligationCollectionsListContent
        viewMode={viewMode}
        collections={filtered}
        search={search}
        typeFilter={typeFilter}
        selectedIds={selectedIds}
        isColumnVisible={columnVisible}
        allVisibleSelected={allVisibleSelected}
        someVisibleSelected={someVisibleSelected}
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
        onToggleSelectAll={toggleSelectAll}
        onToggleSelectedCollection={toggleSelectedCollection}
        onTrashAction={(id) => {
          if (showDeleted) void onRestore?.(id);
          else setPendingTrashId(id);
        }}
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

      <ConfirmAlertDialog
        open={pendingTrashId !== null}
        onOpenChange={(open) => { if (!open) setPendingTrashId(null); }}
        title={t('obligations.trash.deleteTitle')}
        description={t('obligations.trash.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmRowTrash}
      />
      <ConfirmAlertDialog
        open={confirmBulkOpen}
        onOpenChange={setConfirmBulkOpen}
        title={showDeleted ? t('obligations.trash.restore') : t('obligations.trash.deleteTitle')}
        description={t(showDeleted ? 'obligations.trash.bulkRestoreConfirm' : 'obligations.trash.bulkDeleteConfirm', { count: selectedIds.length })}
        confirmLabel={showDeleted ? t('obligations.trash.restore') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkTrash}
      />
    </div>
  );
}
