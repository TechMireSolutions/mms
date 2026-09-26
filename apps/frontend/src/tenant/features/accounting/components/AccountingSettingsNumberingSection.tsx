import React, { useMemo, useCallback } from "react";
import {
  accountingSettingsToSequenceConfig,
  type AccountingSettings,
  type SequenceNumberingConfig,
} from "@mms/shared";
import { SequenceNumberingCard } from "@/components/ui/sequence-numbering";

export interface AccountingSettingsNumberingSectionProps {
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
}

export function AccountingSettingsNumberingSection({
  settingsDraft,
  upd,
}: AccountingSettingsNumberingSectionProps): React.JSX.Element {
  const config = useMemo(
    () => accountingSettingsToSequenceConfig(settingsDraft),
    [settingsDraft]
  );

  const handleChange = useCallback(
    (next: SequenceNumberingConfig) => {
      upd("journalAutoGenerateRef", next.autoGenerate);
      upd("journalRefPrefix", next.prefix);
      upd("journalRefYearFormat", next.yearFormat);
      upd("journalRefSequenceDigits", next.sequenceDigits);
      upd("journalRefDelimiter", next.delimiter);
      upd("journalRefStartingSequence", next.startingSequence);
      upd("journalRefRolloverPolicy", next.rolloverPolicy);
    },
    [upd]
  );

  return (
    <SequenceNumberingCard
      title="Journal Voucher / Entry Numbering"
      entityLabel="Journal Voucher"
      config={config}
      onChange={handleChange}
      allowYearless={true}
      allowFiscalRollover={true}
      defaultPrefixPlaceholder="JE"
    />
  );
}
