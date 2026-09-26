import type {
  SequenceNumberingConfig,
  SequenceYearFormat,
} from "./sequenceNumberingTypes.js";

/** Formats a deterministic sequence ID given a sequence number, configuration, and reference date. */
export function formatDeterministicSequence(
  sequenceNumber: number,
  config: Partial<SequenceNumberingConfig> = {},
  dateInput?: Date | string,
): string {
  const prefix = config.prefix?.trim() ?? "";
  const delimiter = config.delimiter ?? "";
  const digits = Math.max(2, Math.min(8, Number(config.sequenceDigits) || 4));
  const yearFormat: SequenceYearFormat = config.yearFormat ?? "YYYY";

  const parsedDate = dateInput
    ? dateInput instanceof Date
      ? dateInput
      : new Date(dateInput)
    : new Date();
  const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const fullYear = validDate.getFullYear();

  const parts: string[] = [];
  if (prefix.length > 0) {
    parts.push(prefix);
  }

  if (yearFormat === "YYYY") {
    parts.push(String(fullYear));
  } else if (yearFormat === "YY") {
    parts.push(String(fullYear).slice(-2));
  }

  const seqStr = String(Math.max(1, Math.floor(sequenceNumber))).padStart(digits, "0");
  parts.push(seqStr);

  return parts.join(delimiter);
}

/** Generates a human-readable token template representation, e.g. {PREFIX}-{YYYY}-{SEQ}. */
export function buildSequenceFormulaTemplate(
  config: Partial<SequenceNumberingConfig> = {},
): string {
  const delimiter = config.delimiter ?? "";
  const yearFormat: SequenceYearFormat = config.yearFormat ?? "YYYY";

  const tokens: string[] = ["{PREFIX}"];
  if (yearFormat !== "NONE") {
    tokens.push(`{${yearFormat}}`);
  }
  tokens.push("{SEQ}");

  return tokens.join(delimiter);
}

export * from "./sequenceNumberingAdapters.js";
