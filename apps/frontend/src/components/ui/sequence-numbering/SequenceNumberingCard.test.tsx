import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SequenceNumberingCard } from "./SequenceNumberingCard";
import type { SequenceNumberingConfig } from "@mms/shared";

describe("SequenceNumberingCard Component", () => {
  const mockConfig: SequenceNumberingConfig = {
    autoGenerate: true,
    prefix: "FAC",
    yearFormat: "YY",
    sequenceDigits: 3,
    delimiter: "",
    startingSequence: 1,
    rolloverPolicy: "annual_calendar",
    currentSequence: 0,
    lastRolloverYear: 2026,
  };

  it("renders live preview formula and formatted sample badge", () => {
    const html = renderToStaticMarkup(
      <SequenceNumberingCard
        title="Employee ID Configuration"
        entityLabel="Employee ID"
        config={mockConfig}
        onChange={vi.fn()}
      />
    );

    expect(html).toContain("Employee ID Configuration");
    expect(html).toContain("Auto-generate Employee IDs");
    expect(html).toContain("{PREFIX}{YY}{SEQ}");
    expect(html).toContain("Live Preview");
    expect(html).toContain("FAC");
  });

  it("renders yearless configuration when enabled", () => {
    const yearlessConfig: SequenceNumberingConfig = {
      ...mockConfig,
      prefix: "JE",
      yearFormat: "NONE",
      delimiter: "-",
      sequenceDigits: 4,
    };

    const html = renderToStaticMarkup(
      <SequenceNumberingCard
        title="Journal Voucher Numbering"
        entityLabel="Journal Voucher"
        config={yearlessConfig}
        onChange={vi.fn()}
        allowYearless={true}
      />
    );

    expect(html).toContain("Journal Voucher Numbering");
    expect(html).toContain("{PREFIX}-{SEQ}");
    expect(html).toContain("JE-0001");
  });
});
