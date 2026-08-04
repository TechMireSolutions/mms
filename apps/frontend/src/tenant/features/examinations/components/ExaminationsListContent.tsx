import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExaminationsListCards } from "@/tenant/features/examinations/components/ExaminationsListCards";
import { ExaminationsListTable } from "@/tenant/features/examinations/components/ExaminationsListTable";
import type { ExaminationsListContentProps } from "@/tenant/features/examinations/components/examinationsListContentShared";
import { BookOpen } from "lucide-react";

export function ExaminationsListContent(props: ExaminationsListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { exams } = props;

  if (exams.length === 0) {
    return (
      <EmptyState
        variant="dashed"
        icon={BookOpen}
        title={t("examinations.empty.exams")}
        description={t("examinations.empty.examsHint")}
        className="py-16"
      />
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {props.viewMode === "cards" ? (
        <ExaminationsListCards {...props} />
      ) : (
        <ExaminationsListTable {...props} />
      )}
    </div>
  );
}
