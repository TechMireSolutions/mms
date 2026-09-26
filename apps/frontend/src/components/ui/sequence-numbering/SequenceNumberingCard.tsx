import React, { useMemo } from "react";
import { Hash } from "lucide-react";
import { FORM_INPUT, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  formatDeterministicSequence,
  buildSequenceFormulaTemplate,
  type SequenceNumberingConfig,
  type SequenceYearFormat,
} from "@mms/shared";
import { SequenceNumberingPreview } from "./SequenceNumberingPreview";
import { SequenceNumberingParametersGrid } from "./SequenceNumberingParametersGrid";
import { SequenceNumberingTelemetry } from "./SequenceNumberingTelemetry";

export interface SequenceNumberingCardProps {
  title: string;
  entityLabel: string;
  config: SequenceNumberingConfig;
  onChange: (nextConfig: SequenceNumberingConfig) => void;
  allowYearless?: boolean;
  allowFiscalRollover?: boolean;
  defaultPrefixPlaceholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  autoGenerateLabel?: string;
  previewLabel?: string;
  templateLabel?: string;
  prefixLabel?: string;
  prefixHint?: string;
  digitsLabel?: string;
  digitsHint?: string;
  startSeqLabel?: string;
  startSeqHint?: string;
  telemetryLabel?: string;
  restartLabel?: string;
  restartDesc?: string;
}

export function SequenceNumberingCard({
  title,
  entityLabel,
  config,
  onChange,
  allowYearless = false,
  allowFiscalRollover = false,
  defaultPrefixPlaceholder,
  icon = Hash,
  className = SETUP_SECTION_CARD_CLASS,
  autoGenerateLabel,
  previewLabel,
  templateLabel,
  prefixLabel,
  prefixHint,
  digitsLabel,
  digitsHint,
  startSeqLabel,
  startSeqHint,
  telemetryLabel,
  restartLabel,
  restartDesc,
}: SequenceNumberingCardProps): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  const livePreview = useMemo(() => {
    const currentSeq = config.currentSequence ?? 0;
    const seq = currentSeq > 0 ? currentSeq + 1 : config.startingSequence;
    return formatDeterministicSequence(seq, config);
  }, [config]);

  const formulaTemplate = useMemo(() => {
    return buildSequenceFormulaTemplate(config);
  }, [config]);

  const updateField = <K extends keyof SequenceNumberingConfig>(
    field: K,
    val: SequenceNumberingConfig[K]
  ) => {
    onChange({ ...config, [field]: val });
  };

  const isAnnualReset = config.rolloverPolicy !== "never";

  return (
    <SectionCard title={title} icon={icon} accentColor="primary" className={className}>
      <div className="space-y-4">
        {/* Master Auto-generation switch */}
        <ToggleRow
          label={autoGenerateLabel ?? `Auto-generate ${entityLabel}s`}
          value={config.autoGenerate}
          onChange={(value) => updateField("autoGenerate", value)}
        />

        {config.autoGenerate && (
          <>
            {/* Live Preview Card */}
            <SequenceNumberingPreview
              livePreview={livePreview}
              formulaTemplate={formulaTemplate}
              previewLabel={previewLabel}
              templateLabel={templateLabel}
            />

            {/* Core Parameters Grid */}
            <SequenceNumberingParametersGrid
              prefix={config.prefix}
              yearFormat={config.yearFormat}
              sequenceDigits={config.sequenceDigits}
              delimiter={config.delimiter}
              currentYear={currentYear}
              allowYearless={allowYearless}
              prefixLabel={prefixLabel ?? `${entityLabel} Prefix`}
              prefixHint={prefixHint ?? `Default prefix used across ${entityLabel}s`}
              prefixPlaceholder={defaultPrefixPlaceholder ?? "e.g. ID"}
              digitsLabel={digitsLabel}
              digitsHint={digitsHint}
              onChangePrefix={(val) => updateField("prefix", val)}
              onChangeYearFormat={(val: SequenceYearFormat) => updateField("yearFormat", val)}
              onChangeDigits={(val) => updateField("sequenceDigits", val)}
              onChangeDelimiter={(val) => updateField("delimiter", val)}
            />

            {/* Starting Sequence & Live Telemetry Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Field
                label={startSeqLabel ?? "Starting Sequence"}
                hint={startSeqHint ?? "Initial sequence number for generation (e.g. 1 or 1001)"}
                id="sequence-startSeq"
              >
                <Input
                  id="sequence-startSeq"
                  name="sequence-startSeq"
                  type="number"
                  min="1"
                  className={FORM_INPUT}
                  value={config.startingSequence}
                  onChange={(event) =>
                    updateField("startingSequence", Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </Field>

              <SequenceNumberingTelemetry
                currentCounter={config.currentSequence ?? 0}
                rolloverYear={config.lastRolloverYear ?? currentYear}
                telemetryLabel={telemetryLabel}
              />
            </div>

            {/* Annual / Fiscal Rollover Toggle */}
            <div className="pt-2 border-t border-border/40">
              <ToggleRow
                label={
                  restartLabel ??
                  (allowFiscalRollover
                    ? "Restart Sequence Every Fiscal Year"
                    : "Restart Sequence Annually")
                }
                description={
                  restartDesc ??
                  (allowFiscalRollover
                    ? `Reset ${entityLabel} sequence at the start of each fiscal year`
                    : `Reset ${entityLabel} sequence at the beginning of each calendar year`)
                }
                value={isAnnualReset}
                onChange={(enabled) =>
                  updateField(
                    "rolloverPolicy",
                    enabled
                      ? allowFiscalRollover
                        ? "annual_fiscal"
                        : "annual_calendar"
                      : "never"
                  )
                }
              />
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
