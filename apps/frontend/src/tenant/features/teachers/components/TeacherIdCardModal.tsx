import { useRef, type JSX } from "react";
import { Printer, IdCard } from "lucide-react";
import { formatDate, teacherFieldLabelKey, type Teacher } from "@mms/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EmployeeIdBadge } from "@/tenant/features/teachers/components/EmployeeIdBadge";
import { useTranslation } from "@/hooks/useTranslation";

export interface TeacherIdCardItem {
  teacher: Teacher;
  assignedClasses: string[];
  qualification?: string;
  emergencyPhone?: string;
}

export interface TeacherIdCardModalProps {
  open: boolean;
  onClose: () => void;
  items: TeacherIdCardItem[];
  madrasaName?: string;
}

export function TeacherIdCardModal({
  open,
  onClose,
  items,
  madrasaName = "Madrasa Management System",
}: TeacherIdCardModalProps): JSX.Element | null {
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
      title={isBatch ? t("teachers.idCard.batchPrint", { count: items.length }) : t("teachers.idCard.title")}
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
            <span>{t("teachers.idCard.print")}</span>
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
          {items.map(({ teacher, assignedClasses, qualification, emergencyPhone }) => {
            const displayPhone = emergencyPhone || (teacher.phone ? String(teacher.phone) : undefined);

            return (
              <div
                key={teacher.id}
                className="id-card-preview relative border border-border/80 rounded-2xl p-4 bg-gradient-to-br from-card via-card/95 to-muted/30 shadow-sm overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-3">
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-foreground truncate tracking-tight">
                      {madrasaName}
                    </h4>
                    <p className="text-[10px] uppercase font-semibold text-primary tracking-wider">
                      {t("teachers.idCard.title")}
                    </p>
                  </div>
                  {teacher.employeeId && (
                    <EmployeeIdBadge employeeId={teacher.employeeId} />
                  )}
                </div>

                {/* Body Details */}
                <div className="flex items-start gap-3.5 my-auto">
                  <div className="shrink-0 flex flex-col items-center">
                    <UserAvatar
                      id={teacher.id}
                      name={teacher.name}
                      className="w-16 h-16 rounded-xl border-2 border-primary/30 shadow-inner font-bold text-sm"
                    />
                    {teacher.specialization && (
                      <span className="mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 max-w-[80px] truncate text-center">
                        {teacher.specialization}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-sm font-bold text-foreground truncate leading-tight">
                      {teacher.name}
                    </h3>

                    {assignedClasses.length > 0 && (
                      <p className="text-[11px] font-medium text-primary truncate">
                        {assignedClasses.join(", ")}
                      </p>
                    )}

                    {(qualification || teacher.qualification) && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        <span className="font-semibold text-foreground/80">
                          {t(teacherFieldLabelKey("qualification"))}:{" "}
                        </span>
                        <span>{qualification || teacher.qualification}</span>
                      </div>
                    )}

                    {displayPhone && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        <span className="font-semibold text-foreground/80">
                          {t(teacherFieldLabelKey("phone"))}:{" "}
                        </span>
                        <span dir="ltr">{displayPhone}</span>
                      </div>
                    )}

                    {teacher.joinDate && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        <span>{t(teacherFieldLabelKey("joinDate"))}: {teacher.joinDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-3 text-[9px] text-muted-foreground">
                  <div className="flex items-center gap-1 font-mono tracking-widest text-[9px] uppercase">
                    <span>ID: {String(teacher.id).slice(0, 10)}</span>
                  </div>
                  <div>
                    <span>{t("students.idCard.issueDate")}: {formatDate(new Date())}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
