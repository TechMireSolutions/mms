import React from "react";
import { Printer, Save } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { PrintablePaper } from "@/tenant/features/question-bank/components/PrintablePaper";
import type { QuestionBankQuestion as Question } from "@mms/shared";
import type { PaperConfig, PaperSection } from "@/tenant/features/question-bank/components/paperBuilderUtils";

interface PaperPreviewPanelProps {
  config: PaperConfig;
  printRef: React.RefObject<HTMLDivElement | null>;
  questionsById: Map<string, Question>;
  sections: PaperSection[];
  selectedCount: number;
  saving: boolean;
  onPrint: () => void;
  onSave: () => void;
}

export function PaperPreviewPanel({
  config,
  printRef,
  questionsById,
  sections,
  selectedCount,
  saving,
  onPrint,
  onSave,
}: PaperPreviewPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4" aria-label={t("questionBank.paperPreview")}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="m-0 text-[13px] font-bold text-foreground">{t("questionBank.paperPreview")}</h3>
          <p className="m-0 text-[11px] text-muted-foreground">{t("questionBank.paperPreviewDesc")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Button type="button" onClick={onSave} disabled={selectedCount === 0 || saving} variant="outline" size="sm" className="w-full sm:w-auto">
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {t("questionBank.saveTest")}
          </Button>
          <Button type="button" onClick={onPrint} disabled={selectedCount === 0} size="sm" className="w-full sm:w-auto">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            {t("questionBank.printPaper")}
          </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-lg border border-border bg-white p-2 sm:max-h-[720px] sm:p-3">
        <div
          ref={printRef}
          className="origin-top-left scale-[0.42] sm:scale-[0.58] md:scale-[0.7] lg:scale-[0.78]"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          <PrintablePaper config={config} sections={sections} questionsById={questionsById} />
        </div>
      </div>
    </section>
  );
}
