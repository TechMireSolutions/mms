import React, { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { billingPeriodFromDate, todayISO } from "@mms/shared";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { useFinanceInvoiceGeneration } from "@/tenant/features/finance/hooks/useFinanceInvoiceGeneration";

export function FinanceGenerateInvoicesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const sessions = useSessionsCollection({ enabled: open });
  const generate = useFinanceInvoiceGeneration();
  const [period, setPeriod] = useState(() => billingPeriodFromDate(todayISO()));
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");

  const classes = useMemo(
    () => sessions.find((session) => session.id === sessionId)?.classes ?? [],
    [sessionId, sessions],
  );

  const handleGenerate = async (): Promise<void> => {
    try {
      const result = await generate.mutateAsync({
        billingPeriod: period,
        ...(sessionId ? { sessionId } : {}),
        ...(classId ? { classId } : {}),
      });
      if (result.created === 0) {
        notify.info(t("finance.generate.none", { skipped: result.skipped }));
      } else {
        notify.success(t("finance.generate.success", { count: result.created, skipped: result.skipped }));
      }
      onClose();
    } catch (error) {
      notify.error(t("finance.generate.failed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("finance.generate.title")}
      subtitle={t("finance.generate.hint")}
      icon={CalendarRange}
      cancelLabel={t("common.cancel")}
      saveLabel={t("finance.generate.submit")}
      onSave={() => void handleGenerate()}
      saving={generate.isPending}
      saveDisabled={!period || generate.isPending}
    >
      <div className="space-y-4">
        <Field label={t("finance.generate.period")}>
          <Input
            className={FORM_INPUT}
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        </Field>
        <Field label={t("finance.generate.session")}>
          <FormSelect
            value={sessionId}
            onChange={(value) => {
              setSessionId(value);
              setClassId("");
            }}
            options={[
              { value: "", label: t("finance.generate.allSessions") },
              ...sessions.map((session) => ({ value: session.id, label: session.name })),
            ]}
          />
        </Field>
        <Field label={t("finance.generate.class")}>
          <FormSelect
            value={classId}
            onChange={setClassId}
            options={[
              { value: "", label: t("finance.generate.allClasses") },
              ...classes.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </Field>
      </div>
    </FormModal>
  );
}
