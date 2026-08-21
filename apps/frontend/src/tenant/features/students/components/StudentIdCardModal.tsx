import { useRef, type JSX } from "react";
import { Printer, IdCard } from "lucide-react";
import { formatDate, type Student } from "@mms/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { useTranslation } from "@/hooks/useTranslation";

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

export function StudentIdCardModal({
  open,
  onClose,
  items,
  madrasaName = "Madrasa Management System",
}: StudentIdCardModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!open || items.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  const isBatch = items.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isBatch ? t("students.idCard.batchPrint", { count: items.length }) : t("students.idCard.title")}
      icon={IdCard}
      size="lg"
      footer={
        <>
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
      <div className="space-y-4">
        {/* Printable Cards Container */}
        <div
          ref={printAreaRef}
          className="id-card-print-container grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2"
        >
          {items.map(({ student, sessionNames, guardianName, emergencyPhone, bloodGroup }) => (
            <div
              key={student.id}
              className="id-card-preview relative border border-border/80 rounded-2xl p-4 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-sm overflow-hidden flex flex-col justify-between min-h-[220px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-3">
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-foreground truncate tracking-tight">
                    {madrasaName}
                  </h4>
                  <p className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                    {t("students.idCard.title")}
                  </p>
                </div>
                {student.grNumber && (
                  <GrBadge grNumber={student.grNumber} />
                )}
              </div>

              {/* Body Details */}
              <div className="flex items-start gap-3.5 my-auto">
                <div className="shrink-0 flex flex-col items-center">
                  <UserAvatar
                    id={student.id}
                    name={student.name}
                    className="w-16 h-16 rounded-xl border-2 border-primary/30 shadow-inner font-bold text-sm"
                  />
                  {bloodGroup && (
                    <span className="mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      {bloodGroup}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-bold text-foreground truncate leading-tight">
                    {student.name}
                  </h3>

                  {sessionNames.length > 0 && (
                    <p className="text-[11px] font-medium text-primary truncate">
                      {sessionNames.join(", ")}
                    </p>
                  )}

                  {(guardianName || student.fatherName) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      <span className="font-semibold text-foreground/80">
                        {t("students.idCard.guardian")}:{" "}
                      </span>
                      <span>{guardianName || student.fatherName}</span>
                    </div>
                  )}

                  {(emergencyPhone || student.phone) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      <span className="font-semibold text-foreground/80">
                        {t("students.idCard.emergencyContact")}:{" "}
                      </span>
                      <span dir="ltr">{emergencyPhone || student.phone}</span>
                    </div>
                  )}

                  {student.dob && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      <span>{t("students.columns.dob")}: {student.dob}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer / Barcode & Issue Date */}
              <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-3 text-[9px] text-muted-foreground">
                <div className="flex items-center gap-1 font-mono tracking-widest text-[9px] uppercase">
                  <span>ID: {String(student.id).slice(0, 10)}</span>
                </div>
                <div>
                  <span>{t("students.idCard.issueDate")}: {formatDate(new Date())}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
