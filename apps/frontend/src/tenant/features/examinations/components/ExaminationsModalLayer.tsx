import { AnimatePresence } from "framer-motion";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import ExamForm from "@/tenant/features/examinations/components/ExamForm";
import { EnterMarks } from "@/tenant/features/examinations/components/EnterMarks";
import type { Exam, ExamResult } from "@/lib/data/examinationData";

interface ExaminationsModalLayerProps {
  canWrite: boolean;
  showDeleted: boolean;
  showExamForm: boolean;
  showMarksModal: boolean;
  editExam: Exam | null;
  exams: Exam[];
  examResults: ExamResult[];
  onCloseExamForm: () => void;
  onSaveExam: (exam: Exam) => Promise<void>;
  onCloseMarks: () => void;
  onSaveResults: (examId: string, results: ExamResult[]) => Promise<void>;
}

export function ExaminationsModalLayer({
  canWrite,
  showDeleted,
  showExamForm,
  showMarksModal,
  editExam,
  exams,
  examResults,
  onCloseExamForm,
  onSaveExam,
  onCloseMarks,
  onSaveResults,
}: ExaminationsModalLayerProps) {
  const { t } = useTranslation();

  return (
    <>
      <AnimatePresence>
        {showExamForm && canWrite && !showDeleted && (
          <ExamForm
            open={showExamForm}
            exam={editExam}
            onClose={onCloseExamForm}
            onSave={onSaveExam}
          />
        )}
      </AnimatePresence>

      {canWrite && !showDeleted && (
        <FormModal
          open={showMarksModal}
          onClose={onCloseMarks}
          title={t("examinations.marks")}
          size="xl"
          hideFooter
          panelClassName="h-[88vh] max-h-[43.75rem]"
        >
          <EnterMarks exams={exams} results={examResults} onSaveResults={onSaveResults} />
        </FormModal>
      )}
    </>
  );
}
