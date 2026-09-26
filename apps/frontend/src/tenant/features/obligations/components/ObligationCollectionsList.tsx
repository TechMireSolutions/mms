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
  selectedIds?: string[];
  onToggleSelectedCollection?: (id: string, checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean, visibleIds: string[]) => void;
  onClearSelection?: () => void;
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
  selectedIds = [],
  onToggleSelectedCollection,
  onToggleSelectAll,
  onClearSelection,
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
  const [editorCollection, setEditorCollection] = useState<ObligationCollection | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingTrashId, setPendingTrashId] = useState<string | null>(null);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const contactIds = useMemo(() => {
    const ids = new Set<string>();
    for (const collection of collections) {
      if (collection.sender_id) ids.add(collection.sender_id);
      if (collection.reference_id) ids.add(collection.reference_id);
    }
    return Array.from(ids);
  }, [collections]);
  const contacts = useMergedObligationContacts(contactIds);

  const contactsMap = useMemo(() => new Map(contacts.filter(Boolean).map((c) => [String(c.id), c])), [contacts]);
  const repsMap = useMemo(() => new Map(reps.filter(Boolean).map((r) => [String(r.id), r])), [reps]);
  const mujtahidsMap = useMemo(() => new Map(mujtahids.filter(Boolean).map((m) => [String(m.id), m])), [mujtahids]);
  const obTypesMap = useMemo(() => new Map(obligationTypes.filter(Boolean).map((o) => [String(o.id), o])), [obligationTypes]);

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

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return collections.filter((collection) => {
      if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
      if (query) {
        const receipt = collection.receipt_no.toLowerCase();
        const senderContact = getContact(collection.sender_id);
        const refContact = getContact(collection.reference_id);
        const senderName = senderContact?.name?.toLowerCase() || "";
        const senderPhone = senderContact?.phone?.toLowerCase() || "";
        const refName = refContact?.name?.toLowerCase() || "";
        if (
          !receipt.includes(query) &&
          !senderName.includes(query) &&
          !senderPhone.includes(query) &&
          !refName.includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [collections, typeFilter, debouncedSearch, getContact]);

  useEffect(() => {
    onFilteredCountChange?.(filtered.length);
  }, [filtered.length, onFilteredCountChange]);

  const columnVisible = isColumnVisible ?? ALWAYS_COLUMN_VISIBLE;

  const paymentModeConfig = useMemo(() => ({
    Cash: { label: t("obligations.paymentMode.cash"), cls: SEMANTIC_BADGE.warning },
    Online: { label: t("obligations.paymentMode.online"), cls: SEMANTIC_BADGE.info },
  }), [t]) as Record<string, StatusBadgeConfigItem>;

  const selectedSet = new Set(selectedIds);
  const allVisibleSelected = filtered.length > 0 && filtered.every((col) => selectedSet.has(col.id));
  const someVisibleSelected = selectedSet.size > 0 && filtered.some((col) => selectedSet.has(col.id));

  useEffect(() => {
    onClearSelection?.();
  }, [search, typeFilter, onClearSelection]);

  const confirmRowTrash = async (): Promise<void> => {
    if (!pendingTrashId) return;
    try {
      await onDelete?.(pendingTrashId);
    } finally {
      setPendingTrashId(null);
    }
  };

  const confirmBulkTrash = async (): Promise<void> => {
    try {
      if (showDeleted) await onBulkRestore?.(selectedIds);
      else await onBulkDelete?.(selectedIds);
    } finally {
      onClearSelection?.();
      setConfirmBulkOpen(false);
    }
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
          onClearSelection={onClearSelection ?? (() => {})}
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
        onToggleSelectAll={(checked) => onToggleSelectAll?.(checked, filtered.map((col) => col.id))}
        onToggleSelectedCollection={(id, checked) => onToggleSelectedCollection?.(id, checked)}
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
              setEditorCollection(printCollection);
              setPrintCollection(null);
              setShowEditor(true);
            }}
          />
        </Suspense>
      )}

      {showEditor && (
        <Suspense fallback={null}>
          <InvoiceTemplateEditor
            collection={editorCollection}
            obligationTypes={obligationTypes}
            reps={reps}
            mujtahids={mujtahids}
            onClose={() => {
              setShowEditor(false);
              if (editorCollection) {
                setPrintCollection(editorCollection);
              }
              setEditorCollection(null);
            }}
          />
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
