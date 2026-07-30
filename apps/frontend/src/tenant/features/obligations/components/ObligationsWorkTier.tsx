import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { useTranslation } from "@/hooks/useTranslation";
import { ObligationCollectionList } from "@/tenant/features/obligations/components/ObligationCollectionList";
import type { useObligationColumnLayout } from "@/tenant/features/obligations/hooks/useObligationColumnLayout";
import type { ObligationCollection, ObligationType, Mujtahid, MujtahidRep } from "@/lib/data/obligationsData";

interface ObligationsWorkTierProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  listLoadFailed: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canWriteMessaging: boolean;
  columnLayout: ReturnType<typeof useObligationColumnLayout>;
  onAddNew: () => void;
  onView: (collection: ObligationCollection) => void;
  onFilteredCountChange: (count: number) => void;
  onToggleShowDeleted: () => void;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkRestore: (ids: string[]) => Promise<void>;
  onRetry: () => void;
  onMessage: (channel: "sms" | "whatsapp" | "email", collections: ObligationCollection[]) => void;
}

export function ObligationsWorkTier({
  collections,
  obligationTypes,
  reps,
  mujtahids,
  listLoadFailed,
  canWrite,
  canDelete,
  showDeleted,
  canWriteMessaging,
  columnLayout,
  onAddNew,
  onView,
  onFilteredCountChange,
  onToggleShowDeleted,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onRetry,
  onMessage,
}: ObligationsWorkTierProps) {
  const { t } = useTranslation();

  if (listLoadFailed) {
    return <ErrorState title={t("obligations.loadFailed")} onRetry={onRetry} />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <ObligationCollectionList
          collections={collections}
          obligationTypes={obligationTypes}
          reps={reps}
          mujtahids={mujtahids}
          onAddNew={onAddNew}
          onView={onView}
          onFilteredCountChange={onFilteredCountChange}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          onToggleShowDeleted={onToggleShowDeleted}
          onDelete={onDelete}
          onRestore={onRestore}
          onBulkDelete={onBulkDelete}
          onBulkRestore={onBulkRestore}
          isColumnVisible={columnLayout.isColumnVisible}
          getColumnWidth={columnLayout.getColumnWidth}
          onColumnResize={columnLayout.setColumnWidth}
          columnCustomizer={{
            columnRegistry: columnLayout.columnRegistry,
            updateUserColumnLayout: columnLayout.updateUserColumnLayout,
            labels: columnLayout.customizerLabels,
          }}
          onMessage={canWriteMessaging && !showDeleted ? onMessage : undefined}
        />
      </div>
    </ErrorBoundary>
  );
}
