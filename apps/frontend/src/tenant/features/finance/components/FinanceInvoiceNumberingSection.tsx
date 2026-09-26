import React, { useMemo, useCallback } from "react";
import {
  financeSettingsToSequenceConfig,
  type FinanceSettings,
  type SequenceNumberingConfig,
} from "@mms/shared";
import { SequenceNumberingCard } from "@/components/ui/sequence-numbering";

export interface FinanceInvoiceNumberingSectionProps {
  settingsDraft: FinanceSettings;
  upd: <K extends keyof FinanceSettings>(field: K, value: FinanceSettings[K]) => void;
}

export function FinanceInvoiceNumberingSection({
  settingsDraft,
  upd,
}: FinanceInvoiceNumberingSectionProps): React.JSX.Element {
  const config = useMemo(
    () => financeSettingsToSequenceConfig(settingsDraft),
    [settingsDraft]
  );

  const handleChange = useCallback(
    (next: SequenceNumberingConfig) => {
      upd("autoGenerateInvoice", next.autoGenerate);
      upd("invoicePrefix", next.prefix);
      upd("invoiceYearFormat", next.yearFormat);
      upd("invoiceSequenceDigits", next.sequenceDigits);
      upd("invoiceDelimiter", next.delimiter);
      upd("invoiceStartingSequence", next.startingSequence);
      upd("invoiceRolloverPolicy", next.rolloverPolicy);
    },
    [upd]
  );

  return (
    <SequenceNumberingCard
      title="Fee Invoice Numbering"
      entityLabel="Fee Invoice"
      config={config}
      onChange={handleChange}
      allowYearless={true}
      defaultPrefixPlaceholder="INV"
    />
  );
}
