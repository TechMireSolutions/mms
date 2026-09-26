import type {
  SequenceNumberingConfig,
  SequenceYearFormat,
  SequenceRolloverPolicy,
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

/** Adapts Faculty/Teachers settings to a standard SequenceNumberingConfig. */
export function facultySettingsToSequenceConfig(settings: {
  autoGenerateId?: boolean;
  employeeIdPrefix?: string;
  idPrefix?: string;
  employeeIdYearFormat?: "YYYY" | "YY";
  employeeIdSequenceDigits?: number;
  idDigits?: number;
  employeeIdDelimiter?: string;
  idStartSeq?: number;
  idRestartAnnually?: boolean;
  employeeIdCurrentSequence?: number;
  employeeIdLastYear?: number;
}): SequenceNumberingConfig {
  const prefix = settings.employeeIdPrefix ?? settings.idPrefix ?? "FAC";
  const yearFormat = (settings.employeeIdYearFormat ?? "YYYY") as SequenceYearFormat;
  const sequenceDigits = settings.employeeIdSequenceDigits ?? settings.idDigits ?? 4;
  const delimiter = settings.employeeIdDelimiter ?? "";
  const startingSequence = settings.idStartSeq ?? 1;
  const rolloverPolicy: SequenceRolloverPolicy =
    settings.idRestartAnnually === false ? "never" : "annual_calendar";

  return {
    autoGenerate: settings.autoGenerateId !== false,
    prefix,
    yearFormat,
    sequenceDigits,
    delimiter,
    startingSequence,
    rolloverPolicy,
    currentSequence: settings.employeeIdCurrentSequence ?? 0,
    lastRolloverYear: settings.employeeIdLastYear,
  };
}

/** Adapts Students settings to a standard SequenceNumberingConfig with backward-compatibility. */
export function studentSettingsToSequenceConfig(settings: {
  autoGenerateId?: boolean;
  grNumberTemplate?: string;
  grNumberDigits?: number;
  grNumberRestartAnnually?: boolean;
  grNumberPrefix?: string;
  grNumberYearFormat?: SequenceYearFormat;
  grNumberDelimiter?: string;
  grNumberStartSeq?: number;
  grNumberCurrentSeq?: number;
}): SequenceNumberingConfig {
  let prefix = settings.grNumberPrefix ?? "GR";
  let yearFormat: SequenceYearFormat = settings.grNumberYearFormat ?? "YY";
  let delimiter = settings.grNumberDelimiter ?? "";

  // If explicit fields are not set but legacy template exists, infer defaults
  if (settings.grNumberTemplate && !settings.grNumberPrefix) {
    const tmpl = settings.grNumberTemplate;
    if (tmpl.includes("{year}") || tmpl.includes("{YYYY}")) {
      yearFormat = "YYYY";
    } else if (tmpl.includes("{yy}") || tmpl.includes("{YY}")) {
      yearFormat = "YY";
    } else {
      yearFormat = "NONE";
    }

    if (tmpl.includes("-")) delimiter = "-";
    else if (tmpl.includes("/")) delimiter = "/";
    else if (tmpl.includes(".")) delimiter = ".";

    const extractedPrefix = tmpl.split(/[-_./{]/)[0]?.trim();
    if (extractedPrefix && !extractedPrefix.startsWith("{")) {
      prefix = extractedPrefix.toUpperCase();
    }
  }

  return {
    autoGenerate: settings.autoGenerateId !== false,
    prefix,
    yearFormat,
    sequenceDigits: settings.grNumberDigits ?? 4,
    delimiter,
    startingSequence: settings.grNumberStartSeq ?? 1,
    rolloverPolicy: settings.grNumberRestartAnnually !== false ? "annual_calendar" : "never",
    currentSequence: settings.grNumberCurrentSeq ?? 0,
  };
}

/** Adapts Finance settings to a standard SequenceNumberingConfig. */
export function financeSettingsToSequenceConfig(settings: {
  autoGenerateInvoice?: boolean;
  invoicePrefix?: string;
  invoiceYearFormat?: SequenceYearFormat;
  invoiceSequenceDigits?: number;
  invoiceDelimiter?: string;
  invoiceStartingSequence?: number;
  invoiceRolloverPolicy?: SequenceRolloverPolicy;
  invoiceCurrentSequence?: number;
}): SequenceNumberingConfig {
  return {
    autoGenerate: settings.autoGenerateInvoice !== false,
    prefix: settings.invoicePrefix ?? "INV",
    yearFormat: settings.invoiceYearFormat ?? "YYYY",
    sequenceDigits: settings.invoiceSequenceDigits ?? 4,
    delimiter: settings.invoiceDelimiter ?? "-",
    startingSequence: settings.invoiceStartingSequence ?? 1,
    rolloverPolicy: settings.invoiceRolloverPolicy ?? "annual_calendar",
    currentSequence: settings.invoiceCurrentSequence ?? 0,
  };
}


