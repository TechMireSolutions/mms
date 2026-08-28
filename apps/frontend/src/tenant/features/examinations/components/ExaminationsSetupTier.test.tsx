import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExaminationsSetupTier } from "./ExaminationsSetupTier";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/SetupReadOnlyMessage", () => ({
  SetupReadOnlyMessage: ({ title }: { title: string }) => <div data-testid="read-only">{title}</div>,
}));

vi.mock("./ExaminationsSettings", () => ({
  ExaminationsSettings: () => <div data-testid="settings">Examinations Settings</div>,
}));

describe("ExaminationsSetupTier Component", () => {
  it("renders examinations settings when canEditSetup is true", () => {
    const html = renderToStaticMarkup(
      <ExaminationsSetupTier
        tabs={[{ id: "preferences", label: "Preferences" }]}
        activeTab="preferences"
        canEditSetup={true}
        onTabChange={vi.fn()}
      />,
    );

    expect(html).toContain("Examinations Settings");
  });

  it("renders read-only message when canEditSetup is false", () => {
    const html = renderToStaticMarkup(
      <ExaminationsSetupTier
        tabs={[{ id: "preferences", label: "Preferences" }]}
        activeTab="preferences"
        canEditSetup={false}
        onTabChange={vi.fn()}
      />,
    );

    expect(html).toContain("examinations.setup.readOnly");
  });
});
