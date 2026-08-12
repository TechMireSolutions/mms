import React from "react";
import { BookOpen } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Exam } from '@/lib/data/examinationData';
import { useExaminationForm } from "./useExaminationForm";
import { ExaminationFormFields } from "./ExaminationFormFields";

interface ExamFormProps {
  open?: boolean;
  exam: Exam | null;
  onClose: () => void;
  onSave: (exam: Exam) => void | Promise<void>;
}

export default function ExamForm({ open = true, exam, onClose, onSave }: ExamFormProps): React.JSX.Element {
  const form = useExaminationForm({ open, exam, onClose, onSave });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={exam ? form.t("examinations.form.title.edit") : form.t("examinations.form.title.create")}
      icon={BookOpen}
      cancelLabel={form.t("examinations.form.cancel")}
      saveLabel={exam ? form.t("examinations.form.saveChanges") : form.t("examinations.form.create")}
      onSave={form.handleSave}
      saving={form.saving}
      saveDisabled={!form.valid}
    >
      <ExaminationFormFields
        t={form.t}
        errors={form.errors}
        examDraft={form.examDraft}
        classes={form.classes}
        updateDraft={form.updateDraft}
        dfsTabs={form.dfsTabs}
        getFieldError={form.getFieldError}
      />
    </FormModal>
  );
}
