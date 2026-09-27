import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { NextVoucherNumberHint } from "./NextVoucherNumberHint";
import { useTranslation } from "@/hooks/useTranslation";

interface SimpleTransactionRefFieldProps {
  prefix: string;
  refValue: string;
  date: string;
  isDuplicateRef: boolean;
  onChange: (val: string) => void;
  onProceed?: () => void;
}

export function SimpleTransactionRefField({
  prefix,
  refValue,
  date,
  isDuplicateRef,
  onChange,
  onProceed,
}: SimpleTransactionRefFieldProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor={`${prefix}-ref`} className={FORM_LABEL}>
        {t("accounting.journal.dashboard.wizard.refNo")}
      </label>
      <Input
        id={`${prefix}-ref`}
        name="ref"
        autoComplete="off"
        value={refValue}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (!isDuplicateRef) {
              onProceed?.();
            }
          }
        }}
        placeholder={t("accounting.journal.dashboard.wizard.refPlaceholder")}
        aria-invalid={isDuplicateRef}
        aria-describedby={isDuplicateRef ? `${prefix}-ref-error` : refValue.trim() ? undefined : `${prefix}-ref-next`}
      />
      {isDuplicateRef ? (
        <p id={`${prefix}-ref-error`} className="text-xs text-destructive mt-1" role="alert">
          {t("accounting.journal.dashboard.wizard.errorRefDuplicate")}
        </p>
      ) : refValue.trim() ? (
        <p className="text-xs text-muted-foreground mt-1">{t("accounting.journal.dashboard.wizard.optional")}</p>
      ) : (
        <NextVoucherNumberHint id={`${prefix}-ref-next`} date={date} />
      )}
    </div>
  );
}
