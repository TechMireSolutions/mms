import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  coercePaperNumberInput,
  type PaperConfig,
} from "@/tenant/features/question-bank/components/paperBuilderUtils";

interface PaperDetailsFormProps {
  config: PaperConfig;
  onChange: <Field extends keyof PaperConfig>(field: Field, value: PaperConfig[Field]) => void;
}

export function PaperDetailsForm({ config, onChange }: PaperDetailsFormProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="paper-name" className={FORM_LABEL}>{t("questionBank.paperName")}</label>
          <Input
            id="paper-name"
            className={`${FORM_INPUT} shadow-none`}
            value={config.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder={t("questionBank.paperNamePlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="paper-class" className={FORM_LABEL}>{t("questionBank.paperClass")}</label>
          <Input
            id="paper-class"
            className={`${FORM_INPUT} shadow-none`}
            value={config.examClass}
            onChange={(event) => onChange("examClass", event.target.value)}
            placeholder={t("questionBank.paperClassPlaceholder")}
          />
        </div>
        <div>
          <label htmlFor="paper-duration" className={FORM_LABEL}>{t("questionBank.durationMin")}</label>
          <Input
            id="paper-duration"
            type="number"
            className={`${FORM_INPUT} shadow-none`}
            value={config.duration}
            min={5}
            onChange={(event) => onChange("duration", coercePaperNumberInput(event.target.value, config.duration, 5))}
          />
        </div>
        <div>
          <label htmlFor="paper-marks" className={FORM_LABEL}>{t("questionBank.paperTotalMarks")}</label>
          <Input
            id="paper-marks"
            type="number"
            className={`${FORM_INPUT} shadow-none`}
            value={config.totalMarks}
            min={1}
            onChange={(event) => onChange("totalMarks", coercePaperNumberInput(event.target.value, config.totalMarks, 1))}
          />
        </div>
        <div className="md:col-span-3">
          <label htmlFor="paper-instructions" className={FORM_LABEL}>{t("questionBank.paperInstructions")}</label>
          <Textarea
            id="paper-instructions"
            className={`${FORM_INPUT} min-h-20 shadow-none`}
            value={config.instructions}
            onChange={(event) => onChange("instructions", event.target.value)}
            placeholder={t("questionBank.paperInstructionsPlaceholder")}
          />
        </div>
      </div>
    </section>
  );
}
