import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ExaminationsListCards } from "@/tenant/features/examinations/components/ExaminationsListCards";
import { ExaminationsListTable } from "@/tenant/features/examinations/components/ExaminationsListTable";
import type { ExaminationsListContentProps } from "@/tenant/features/examinations/components/examinationsListContentShared";
import { BookOpen } from "lucide-react";

export type { ExaminationsVisibleColumns } from "@/tenant/features/examinations/components/examinationsListContentShared";

export function ExaminationsListContent(props: ExaminationsListContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { exams } = props;

  if (exams.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border-2 border-dashed border-border" role="status">
        <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">{t("examinations.empty.exams")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("examinations.empty.examsHint")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <ExaminationsListCards {...props} />
      <ExaminationsListTable {...props} />
    </div>
  );
}
