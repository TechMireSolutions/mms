import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MessagingWorkBulkActionBar } from "./MessagingWorkBulkActionBar";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "messaging.selectedCount") return `${params?.count} selected`;
      if (key === "messaging.exportLogs") return "Export";
      if (key === "messaging.clearLogs") return "Clear";
      if (key === "messaging.resend") return "Resend";
      if (key === "common.deselect") return "Deselect";
      return key;
    },
  }),
}));

describe("MessagingWorkBulkActionBar", () => {
  it("renders selected count, export, resend, and clear logs actions when enabled", () => {
    const html = renderToStaticMarkup(
      <MessagingWorkBulkActionBar
        selectedCount={3}
        canWrite={true}
        canClearLogs={true}
        onClearSelection={() => {}}
        onBulkExport={() => {}}
        onBulkResend={() => {}}
        onClearLogsRequest={() => {}}
      />
    );

    expect(html).toContain("3 selected");
    expect(html).toContain("Deselect (Esc)");
    expect(html).toContain("Resend");
    expect(html).toContain("Export (3)");
    expect(html).toContain("Clear");
  });

  it("hides write and clear actions when canWrite and canClearLogs are false", () => {
    const html = renderToStaticMarkup(
      <MessagingWorkBulkActionBar
        selectedCount={2}
        canWrite={false}
        canClearLogs={false}
        onClearSelection={() => {}}
      />
    );

    expect(html).toContain("2 selected");
    expect(html).toContain("Deselect (Esc)");
    expect(html).not.toContain("Export");
    expect(html).not.toContain("Clear");
  });
});
