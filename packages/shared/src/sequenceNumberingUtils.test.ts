import { describe, it, expect } from "vitest";
import {
  formatDeterministicSequence,
  buildSequenceFormulaTemplate,
  facultySettingsToSequenceConfig,
  studentSettingsToSequenceConfig,
  accountingSettingsToSequenceConfig,
  financeSettingsToSequenceConfig,
} from "./sequenceNumberingUtils.js";


describe("sequenceNumberingUtils", () => {
  describe("formatDeterministicSequence", () => {
    it("formats standard employee ID with default options", () => {
      const result = formatDeterministicSequence(1, {
        prefix: "FAC",
        yearFormat: "YY",
        sequenceDigits: 3,
        delimiter: "",
      }, new Date(2026, 0, 15));
      expect(result).toBe("FAC26001");
    });

    it("formats student GR number with hyphen delimiter and 4 digits", () => {
      const result = formatDeterministicSequence(42, {
        prefix: "GR",
        yearFormat: "YYYY",
        sequenceDigits: 4,
        delimiter: "-",
      }, new Date(2026, 5, 20));
      expect(result).toBe("GR-2026-0042");
    });

    it("formats yearless accounting journal voucher reference", () => {
      const result = formatDeterministicSequence(1, {
        prefix: "JE",
        yearFormat: "NONE",
        sequenceDigits: 4,
        delimiter: "-",
      });
      expect(result).toBe("JE-0001");
    });

    it("handles empty prefix cleanly", () => {
      const result = formatDeterministicSequence(5, {
        prefix: "",
        yearFormat: "YYYY",
        sequenceDigits: 4,
        delimiter: "-",
      }, new Date(2026, 1, 1));
      expect(result).toBe("2026-0005");
    });
  });

  describe("buildSequenceFormulaTemplate", () => {
    it("builds template with year token", () => {
      const template = buildSequenceFormulaTemplate({
        delimiter: "",
        yearFormat: "YY",
      });
      expect(template).toBe("{PREFIX}{YY}{SEQ}");
    });

    it("builds template with hyphen delimiter", () => {
      const template = buildSequenceFormulaTemplate({
        delimiter: "-",
        yearFormat: "YYYY",
      });
      expect(template).toBe("{PREFIX}-{YYYY}-{SEQ}");
    });

    it("omits year token when yearFormat is NONE", () => {
      const template = buildSequenceFormulaTemplate({
        delimiter: "-",
        yearFormat: "NONE",
      });
      expect(template).toBe("{PREFIX}-{SEQ}");
    });
  });

  describe("module adapters", () => {
    it("adapts faculty settings accurately", () => {
      const config = facultySettingsToSequenceConfig({
        autoGenerateId: true,
        employeeIdPrefix: "FAC",
        employeeIdYearFormat: "YY",
        employeeIdSequenceDigits: 3,
        employeeIdDelimiter: "",
        idStartSeq: 10,
        idRestartAnnually: true,
        employeeIdCurrentSequence: 5,
        employeeIdLastYear: 2026,
      });
      expect(config.prefix).toBe("FAC");
      expect(config.yearFormat).toBe("YY");
      expect(config.sequenceDigits).toBe(3);
      expect(config.startingSequence).toBe(10);
      expect(config.currentSequence).toBe(5);
    });

    it("adapts student settings accurately", () => {
      const config = studentSettingsToSequenceConfig({
        autoGenerateId: true,
        grNumberTemplate: "GR-{seq}",
        grNumberDigits: 5,
        grNumberRestartAnnually: false,
      });
      expect(config.prefix).toBe("GR");
      expect(config.sequenceDigits).toBe(5);
      expect(config.yearFormat).toBe("NONE");
      expect(config.rolloverPolicy).toBe("never");
    });

    it("adapts accounting settings accurately", () => {
      const config = accountingSettingsToSequenceConfig({
        journalRefPrefix: "JV",
        journalRefSequenceDigits: 5,
      });
      expect(config.prefix).toBe("JV");
      expect(config.sequenceDigits).toBe(5);
      expect(config.yearFormat).toBe("NONE");
      expect(config.delimiter).toBe("-");
    });

    it("adapts finance settings accurately", () => {
      const config = financeSettingsToSequenceConfig({
        autoGenerateInvoice: true,
        invoicePrefix: "BILL",
        invoiceSequenceDigits: 6,
        invoiceDelimiter: "/",
        invoiceYearFormat: "YY",
      });
      expect(config.prefix).toBe("BILL");
      expect(config.sequenceDigits).toBe(6);
      expect(config.delimiter).toBe("/");
      expect(config.yearFormat).toBe("YY");
      expect(config.rolloverPolicy).toBe("annual_calendar");
    });
  });
});

