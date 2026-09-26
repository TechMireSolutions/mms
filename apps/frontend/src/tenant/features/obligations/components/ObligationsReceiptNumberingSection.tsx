import React, { useMemo, useCallback } from "react";
import {
  obligationsSettingsToSequenceConfig,
  type SequenceNumberingConfig,
} from "@mms/shared";
import { SequenceNumberingCard } from "@/components/ui/sequence-numbering";
import { useObligationsSettings } from "@/tenant/features/obligations/hooks/useObligationsSettings";

export function ObligationsReceiptNumberingSection(): React.JSX.Element {
  const { settings, updateSettings } = useObligationsSettings();

  const config = useMemo(
    () => obligationsSettingsToSequenceConfig(settings),
    [settings]
  );

  const handleChange = useCallback(
    (next: SequenceNumberingConfig) => {
      updateSettings({
        ...settings,
        autoGenerateReceipt: next.autoGenerate,
        receiptPrefix: next.prefix,
        receiptYearFormat: next.yearFormat,
        receiptSequenceDigits: next.sequenceDigits,
        receiptDelimiter: next.delimiter,
        receiptStartingSequence: next.startingSequence,
        receiptRolloverPolicy: next.rolloverPolicy,
      });
    },
    [settings, updateSettings]
  );

  return (
    <div className="max-w-3xl text-start">
      <SequenceNumberingCard
        title="Receipt Numbering"
        entityLabel="Receipt"
        config={config}
        onChange={handleChange}
        allowYearless={true}
        defaultPrefixPlaceholder="OBL"
      />
    </div>
  );
}

export default ObligationsReceiptNumberingSection;
