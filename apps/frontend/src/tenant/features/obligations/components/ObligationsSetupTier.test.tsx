import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ObligationsSetupTier } from "./ObligationsSetupTier";

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
  SetupReadOnlyMessage: ({ title }: { title: string }) => (
    <div data-testid="setup-read-only-message">{title}</div>
  ),
}));

vi.mock("@/components/ui/SubTabBar", () => ({
  SubTabBar: () => <div data-testid="sub-tab-bar">SubTabBar</div>,
}));

vi.mock("./ObligationTypeManager", () => ({
  default: () => <div data-testid="obligation-type-manager">Obligation Type Manager</div>,
  ObligationTypeManager: () => <div data-testid="obligation-type-manager">Obligation Type Manager</div>,
}));

vi.mock("./MujtahidManager", () => ({
  default: () => <div data-testid="mujtahid-manager">Mujtahid Manager</div>,
  MujtahidManager: () => <div data-testid="mujtahid-manager">Mujtahid Manager</div>,
}));

vi.mock("./WakalaTypeManager", () => ({
  default: () => <div data-testid="wakala-type-manager">Wakala Type Manager</div>,
  WakalaTypeManager: () => <div data-testid="wakala-type-manager">Wakala Type Manager</div>,
}));

describe("ObligationsSetupTier Component", () => {
  const defaultProps = {
    tabs: [
      { id: "types", label: "Types" },
      { id: "mujtahids", label: "Mujtahids" },
      { id: "wakala", label: "Wakala" },
    ],
    activeTab: "types",
    canEditSetup: true,
    obligationTypes: [],
    mujtahids: [],
    reps: [],
    wakalaTypes: [],
    distributions: [],
    onTabChange: vi.fn(),
    onChangeTypes: vi.fn(),
    onChangeMujtahids: vi.fn(),
    onChangeReps: vi.fn(),
    onChangeWakala: vi.fn(),
    onChangeDistributions: vi.fn(),
  };

  it("renders subtab bar and tier motion in editable mode", () => {
    const html = renderToStaticMarkup(<ObligationsSetupTier {...defaultProps} />);
    expect(html).toContain("module-tier-motion");
    expect(html).toContain("SubTabBar");
  });

  it("renders read-only message when canEditSetup is false", () => {
    const html = renderToStaticMarkup(
      <ObligationsSetupTier {...defaultProps} canEditSetup={false} />,
    );
    expect(html).toContain("setup-read-only-message");
    expect(html).toContain("obligations.setup.readOnly");
  });
});
