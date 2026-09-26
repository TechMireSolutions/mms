import { useId, useState } from "react";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_LABEL } from "@/components/ui/formStyles";
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
  const hintId = useId();
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
        <label htmlFor={dateId} className={FORM_LABEL}>
          {t("accounting.journal.alerts.reversalDateLabel")}
        </label>
        <DatePicker
          id={dateId}
          name="reversalDate"
          value={date}
          min={entry.date}
          onChange={setDate}
          required
          aria-describedby={hintId}
        />
        <p id={hintId} className="m-0 mt-1 text-xs text-muted-foreground">
          {t("accounting.journal.alerts.reversalDateHint", { date: entry.date })}
        </p>
      </div>
    </ConfirmAlertDialog>
  );
}
