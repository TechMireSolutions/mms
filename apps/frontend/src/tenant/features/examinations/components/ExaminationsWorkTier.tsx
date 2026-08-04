import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import ExamsList from "@/tenant/features/examinations/components/ExamsList";
import { ResultsView } from "@/tenant/features/examinations/components/ResultsView";
import type { useExaminationExamColumnLayout } from "@/tenant/features/examinations/hooks/useExaminationExamColumnLayout";
import type { useExaminationResultsColumnLayout } from "@/tenant/features/examinations/hooks/useExaminationResultsColumnLayout";
import type { Exam, ExamResult } from "@/lib/data/examinationData";

interface WorkTab {
  id: string;
  label: string;
}

interface ExaminationsWorkTierProps {
  tabs: WorkTab[];
  activeSubTab: string;
  showDeleted: boolean;
  listLoadFailed: boolean;
  canWrite: boolean;
  canDelete: boolean;
  createExamKey: number;
  exams: Exam[];
  examResults: ExamResult[];
  examColumnLayout: ReturnType<typeof useExaminationExamColumnLayout>;
  resultsColumnLayout: ReturnType<typeof useExaminationResultsColumnLayout>;
  onSubTabChange: (tab: string) => void;
  onToggleDeleted: () => void;
  onRetry: () => void;
  onDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkRestore: (ids: string[]) => Promise<void>;
  onNew: () => void;
  onEdit: (exam: Exam) => void;
  onFilteredCountChange: (count: number) => void;
}

export function ExaminationsWorkTier({
  tabs,
  activeSubTab,
  showDeleted,
  listLoadFailed,
  canWrite,
  canDelete,
  createExamKey,
  exams,
  examResults,
  examColumnLayout,
  resultsColumnLayout,
  onSubTabChange,
  onToggleDeleted,
  onRetry,
  onDelete,
  onRestore,
  onBulkDelete,
  onBulkRestore,
  onNew,
  onEdit,
  onFilteredCountChange,
}: ExaminationsWorkTierProps) {
  const { t } = useTranslation();

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SubTabBar
          tabs={tabs.map((tab) => ({ key: tab.id, label: tab.label }))}
          value={activeSubTab}
          onChange={(next) => {
            onSubTabChange(next);
            if (next !== "exams" && showDeleted) onToggleDeleted();
          }}
        />
        {activeSubTab === "exams" && canDelete && (
          <ModuleTrashToggle
            showDeleted={showDeleted}
            onToggle={onToggleDeleted}
            showActiveLabel={t("examinations.trash.showActive")}
            showDeletedLabel={t("examinations.trash.showDeleted")}
            className="gap-1.5 shrink-0"
          />
        )}
      </div>

      {listLoadFailed ? (
        <ErrorState
          title={t("examinations.loadFailed")}
          description={t("examinations.loadFailedHint")}
          onRetry={onRetry}
        />
      ) : (
        <>
          {activeSubTab === "exams" && (
            <ExamsList
              exams={exams}
              canWrite={canWrite}
              canDelete={canDelete}
              showDeleted={showDeleted}
              createRequestKey={createExamKey}
              onDelete={onDelete}
              onRestore={onRestore}
              onBulkDelete={onBulkDelete}
              onBulkRestore={onBulkRestore}
              onNew={onNew}
              onEdit={onEdit}
              onFilteredCountChange={onFilteredCountChange}
              isColumnVisible={examColumnLayout.isColumnVisible}
              getColumnWidth={examColumnLayout.getColumnWidth}
              onColumnResize={examColumnLayout.setColumnWidth}
              columnCustomizer={{
                columnRegistry: examColumnLayout.columnRegistry,
                updateUserColumnLayout: examColumnLayout.updateUserColumnLayout,
                labels: examColumnLayout.customizerLabels,
              }}
            />
          )}
          {activeSubTab === "results" && (
            <ResultsView
              exams={exams}
              results={examResults}
              onFilteredCountChange={onFilteredCountChange}
              isColumnVisible={resultsColumnLayout.isColumnVisible}
              columnCustomizer={{
                columnRegistry: resultsColumnLayout.columnRegistry,
                updateUserColumnLayout: resultsColumnLayout.updateUserColumnLayout,
                labels: resultsColumnLayout.customizerLabels,
              }}
            />
          )}
        </>
      )}
    </ErrorBoundary>
  );
}
