import React, { useRef, useState, lazy, Suspense, type JSX } from "react";
import { Printer, IdCard, Paintbrush, RotateCw, Scissors } from "lucide-react";
import { STUDENTS_MODULE_MANIFEST, type Student } from "@mms/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { useStudentCardTemplate } from "../lib/studentCardTemplateStore";
import { StudentCardPrintPreview } from "./card-template/StudentCardPrintPreview";
import { StudentIdCardFlipItem } from "./card-template/StudentIdCardFlipItem";

const StudentCardTemplateEditor = lazy(
  () => import("./card-template/StudentCardTemplateEditor"),
);

export interface StudentIdCardItem {
  student: Student;
  sessionNames: string[];
  guardianName?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
}

export interface StudentIdCardModalProps {
  open: boolean;
  onClose: () => void;
  items: StudentIdCardItem[];
  madrasaName?: string;
}

type PrintMode = "front" | "back" | "both";

export function StudentIdCardModal({
  open,
  onClose,
  items,
  madrasaName = "Madrasa Management System",
}: StudentIdCardModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [printMode, setPrintMode] = useState<PrintMode>("front");
  const [globalFlipped, setGlobalFlipped] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [showCutGuides, setShowCutGuides] = useState(true);
  const { canEditSetup } = useModulePermissions(STUDENTS_MODULE_MANIFEST);
  const { template } = useStudentCardTemplate();

  if (!open || items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBatch = items.length > 1;

  const toggleCardFlip = (studentId: string | number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const cutGuideClass = showCutGuides
    ? "ring-1 ring-dashed ring-slate-400/60 print:ring-1 print:ring-dashed print:ring-black/50"
    : "";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isBatch ? t("students.idCard.batchPrint", { count: items.length }) : t("students.idCard.title")}
        icon={IdCard}
        size="lg"
        footer={
          <>
            {canEditSetup && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditor(true)}
                className="flex items-center gap-2 min-h-11 px-4 font-medium me-auto"
              >
                <Paintbrush className="w-4 h-4" />
                <span>{t("students.idCard.customize")}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-11 px-4 font-medium"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 min-h-11 font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>{t("students.idCard.print")}</span>
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {/* Print Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border text-xs print:hidden">
            {/* Side Mode Selector */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/80 rounded-lg border border-border/80">
              <button
                type="button"
                onClick={() => {
                  setPrintMode("front");
                  setGlobalFlipped(false);
                }}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  printMode === "front"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("students.idCard.printFrontOnly") || "Front Only"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintMode("back");
                  setGlobalFlipped(true);
                }}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  printMode === "back"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("students.idCard.printBackOnly") || "Back Only"}
              </button>
              <button
                type="button"
                onClick={() => setPrintMode("both")}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  printMode === "both"
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("students.idCard.printBothSides") || "Both Sides"}
              </button>
            </div>

            {/* Quick Actions: Flip & Cut Guides */}
            <div className="flex items-center gap-1.5">
              {printMode !== "both" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGlobalFlipped((prev) => !prev)}
                  className="flex items-center gap-1.5 h-8 px-2.5 text-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t("students.idCard.flipAll") || "Flip All"}</span>
                </Button>
              )}

              <Button
                type="button"
                variant={showCutGuides ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowCutGuides((prev) => !prev)}
                className="flex items-center gap-1.5 h-8 px-2.5 text-xs"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{t("students.idCard.cutGuides") || "Cut Guides"}</span>
              </Button>
            </div>
          </div>

          {/* Printable Cards Container */}
          <div
            ref={printAreaRef}
            data-print-unclamp
            className="id-card-print-container grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-dialog-scroll overflow-y-auto p-2 print:grid-cols-2 print:gap-3 print:max-h-none print:overflow-visible print:p-0"
          >
            {items.map(({ student, sessionNames, guardianName, emergencyPhone, bloodGroup }) => {
              if (printMode === "both") {
                return (
                  <React.Fragment key={student.id}>
                    {/* Front Side */}
                    <div className="relative group">
                      <StudentCardPrintPreview
                        template={template}
                        student={student}
                        side="front"
                        sessionNames={sessionNames}
                        guardianName={guardianName}
                        emergencyPhone={emergencyPhone}
                        bloodGroup={bloodGroup}
                        madrasaName={madrasaName}
                        className={cutGuideClass}
                      />
                      <span className="absolute top-1.5 end-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 print:hidden">
                        {t("students.idCard.frontSide") || "Front"}
                      </span>
                    </div>

                    {/* Back Side */}
                    <div className="relative group">
                      <StudentCardPrintPreview
                        template={template}
                        student={student}
                        side="back"
                        sessionNames={sessionNames}
                        guardianName={guardianName}
                        emergencyPhone={emergencyPhone}
                        bloodGroup={bloodGroup}
                        madrasaName={madrasaName}
                        className={cutGuideClass}
                      />
                      <span className="absolute top-1.5 end-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 print:hidden">
                        {t("students.idCard.backSide") || "Back"}
                      </span>
                    </div>
                  </React.Fragment>
                );
              }

              const isFlipped =
                printMode === "back"
                  ? !flippedCards[student.id]
                  : Boolean(flippedCards[student.id] !== globalFlipped);

              return (
                <StudentIdCardFlipItem
                  key={student.id}
                  student={student}
                  template={template}
                  sessionNames={sessionNames}
                  guardianName={guardianName}
                  emergencyPhone={emergencyPhone}
                  bloodGroup={bloodGroup}
                  madrasaName={madrasaName}
                  cutGuideClass={cutGuideClass}
                  isFlipped={isFlipped}
                  onToggleFlip={() => toggleCardFlip(student.id)}
                  t={t}
                />
              );
            })}
          </div>
        </div>
      </Modal>

      {showEditor && (
        <Suspense fallback={null}>
          <StudentCardTemplateEditor
            onClose={() => setShowEditor(false)}
            sampleStudent={items[0]?.student}
            sessionNames={items[0]?.sessionNames}
            guardianName={items[0]?.guardianName}
            emergencyPhone={items[0]?.emergencyPhone}
            bloodGroup={items[0]?.bloodGroup}
          />
        </Suspense>
      )}
    </>
  );
}

