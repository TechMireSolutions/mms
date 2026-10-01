import { useId, useState } from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormField";
import { todayISO } from "@mms/shared";
import type { JournalEntry } from "@/lib/data/accountingData";
import { useTranslation } from "@/hooks/useTranslation";

interface JournalReverseDialogProps {
  entry: JournalEntry;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void | Promise<void>;
}

/** Reverse confirmation with a reversal date — defaults to today, never before the original. */
export function JournalReverseDialog({ entry, onOpenChange, onConfirm }: JournalReverseDialogProps) {
  const { t } = useTranslation();
  const dateId = useId();
  const [date, setDate] = useState(() => {
    const today = todayISO();
    return today < entry.date ? entry.date : today;
  });

  return (
    <ConfirmAlertDialog
      open
      onOpenChange={onOpenChange}
      title={t("accounting.journal.actions.reverse")}
      description={t("accounting.journal.alerts.reverseConfirm", { ref: entry.ref })}
      confirmLabel={t("accounting.journal.actions.reverse")}
      cancelLabel={t("common.cancel")}
      onConfirm={() => (date ? onConfirm(date) : false)}
    >
      <div className="px-1 pb-1">
        <Field
          id={dateId}
          label={t("accounting.journal.alerts.reversalDateLabel")}
          hint={t("accounting.journal.alerts.reversalDateHint", { date: entry.date })}
        >
          <DatePicker
            id={dateId}
            name="reversalDate"
            value={date}
            min={entry.date}
            onChange={setDate}
            required
          />
        </Field>
      </div>
    </ConfirmAlertDialog>
  );
}
