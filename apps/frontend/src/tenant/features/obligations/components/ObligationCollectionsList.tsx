import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import {
  type ObligationCollection, type ObligationType, type MujtahidRep, type Mujtahid
} from '@/lib/data/obligationsData';
import { useDebounce } from "@/hooks/useDebounce";
import { useMergedObligationContacts } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import type { ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleStandardTrashDialogs } from "@/components/ui/ModuleStandardTrashDialogs";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ObligationCollectionsListContent } from "@/tenant/features/obligations/components/ObligationCollectionsListContent";
import { ObligationCollectionsListFilters } from "@/tenant/features/obligations/components/ObligationCollectionsListFilters";
import { ObligationsBulkActionBar } from "@/tenant/features/obligations/components/ObligationsBulkActionBar";
import { useObligationSelection } from "@/tenant/features/obligations/hooks/useObligationSelection";

const PrintInvoiceModal = lazy(() => import("@/tenant/features/obligations/components/invoice/PrintInvoiceModal").then((module) => ({ default: module.PrintInvoiceModal })));
const InvoiceTemplateEditor = lazy(() => import("@/tenant/features/obligations/components/invoice/InvoiceTemplateEditor").then((module) => ({ default: module.InvoiceTemplateEditor })));
import type { StatusBadgeConfigItem } from '@/components/ui/StatusBadge';

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
  const [showEditor, setShowEditor] = useState(false);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const senderIds = useMemo(
    () => collections.map((collection) => collection.sender_id),
    [collections],
  );
  const contacts = useMergedObligationContacts(senderIds);

  const contactsMap = useMemo(() => {
    const map = new Map<string, (typeof contacts)[number]>();
    for (const c of contacts) {
      if (c?.id != null) map.set(String(c.id), c);
    }
    return map;
  }, [contacts]);

  const repsMap = useMemo(() => {
    const map = new Map<string, (typeof reps)[number]>();
    for (const r of reps) {
      if (r?.id != null) map.set(String(r.id), r);
    }
    return map;
  }, [reps]);

  const mujtahidsMap = useMemo(() => {
    const map = new Map<string, (typeof mujtahids)[number]>();
    for (const m of mujtahids) {
      if (m?.id != null) map.set(String(m.id), m);
    }
    return map;
  }, [mujtahids]);

  const obTypesMap = useMemo(() => {
    const map = new Map<string, (typeof obligationTypes)[number]>();
    for (const o of obligationTypes) {
      if (o?.id != null) map.set(String(o.id), o);
    }
    return map;
  }, [obligationTypes]);

  const getContact = useCallback(
    (contactId?: string | number | null) => (contactId != null ? contactsMap.get(String(contactId)) : undefined),
    [contactsMap],
  );
  const getRep = useCallback((repId: string) => repsMap.get(repId), [repsMap]);
  const getMujtahid = useCallback((repId: string) => {
    const rep = getRep(repId);
    return rep ? mujtahidsMap.get(rep.mujtahid_id) : null;
  }, [getRep, mujtahidsMap]);
  const getObType = useCallback((obligationTypeId: string) => obTypesMap.get(obligationTypeId), [obTypesMap]);

  const filtered = useMemo(() => collections.filter((collection) => {
    if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
    if (debouncedSearch) {
      const searchQuery = debouncedSearch.toLowerCase();
      const sender = getContact(collection.sender_id)?.name?.toLowerCase() || "";
      const receipt = collection.receipt_no.toLowerCase();
      if (!sender.includes(searchQuery) && !receipt.includes(searchQuery)) return false;
    }
    return true;
  }), [collections, typeFilter, debouncedSearch, getContact]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const paymentModeConfig = useMemo(() => ({
    Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
    Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
  }), [t]) as Record<string, StatusBadgeConfigItem>;

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
    clearSelection();
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
          onClearSelection={clearSelection}
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
            onOpenEditor={() => {
              setPrintCollection(null);
              setShowEditor(true);
            }}
          />
        </Suspense>
      )}

      {showEditor && (
        <Suspense fallback={null}>
          <InvoiceTemplateEditor onClose={() => setShowEditor(false)} />
        </Suspense>
      )}

      <ModuleStandardTrashDialogs
        pendingTrashId={pendingTrashId}
        onPendingTrashIdChange={setPendingTrashId}
        confirmBulkOpen={confirmBulkOpen}
        onConfirmBulkOpenChange={setConfirmBulkOpen}
        showDeleted={showDeleted}
        selectedCount={selectedIds.length}
        i18nNamespace="obligations"
        onConfirmRowTrash={confirmRowTrash}
        onConfirmBulkTrash={confirmBulkTrash}
      />
    </div>
  );
}
