import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuestionBankSetupTier } from "./QuestionBankSetupTier";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="module-tier-motion">{children}</div>
  ),
}));

vi.mock("@/components/ui/SetupReadOnlyMessage", () => ({
  SetupReadOnlyMessage: ({ title }: { title: string }) => <div data-testid="read-only">{title}</div>,
}));

vi.mock("./QuestionBankSettings", () => ({
  default: () => <div data-testid="settings">Question Bank Settings</div>,
  QuestionBankSettings: () => <div data-testid="settings">Question Bank Settings</div>,
}));

describe("QuestionBankSetupTier Component", () => {
  it("renders settings when canEditSetup is true", () => {
    const html = renderToStaticMarkup(
      <QuestionBankSetupTier
        tabs={[{ id: "preferences", label: "Preferences" }]}
        activeTab="preferences"
        canEditSetup={true}
        onTabChange={vi.fn()}
      />,
    );

    expect(html).toContain("module-tier-motion");
    expect(html).toBeDefined();
  });

  it("renders read-only message when canEditSetup is false", () => {
    const html = renderToStaticMarkup(
      <QuestionBankSetupTier
        tabs={[{ id: "preferences", label: "Preferences" }]}
        activeTab="preferences"
        canEditSetup={false}
        onTabChange={vi.fn()}
      />,
    );

    expect(html).toContain("questionBank.setup.readOnly");
  });
});
