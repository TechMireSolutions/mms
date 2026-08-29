import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MessagingSetupTier } from "./MessagingSetupTier";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1" },
  }),
}));

vi.mock("../hooks/useMessaging", () => ({
  useMessageTemplates: () => ({
    templates: [],
    isError: false,
    refetch: vi.fn(),
  }),
  useMessagingMutations: () => ({
    saveTemplate: { mutateAsync: vi.fn() },
  }),
}));

vi.mock("../hooks/useMessagingColumnLayouts", () => ({
  useMessagingTemplatesColumnLayout: () => ({
    getColumnWidth: () => 150,
    setColumnWidth: vi.fn(),
  }),
}));

vi.mock("../hooks/useMessagingPageOptions", () => ({
  useMessagingPageOptions: () => ({
    categorySelectOptions: [],
    templateCategorySelectOptions: [],
    channelSelectOptions: [],
    categoryBadgeConfig: {},
  }),
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="module-tier-motion">{children}</div>
  ),
}));

vi.mock("@/components/ui/SubTabBar", () => ({
  SubTabBar: () => <div data-testid="sub-tab-bar">SubTabBar</div>,
}));

vi.mock("./MessagingSetupTemplateForm", () => ({
  MessagingSetupTemplateForm: ({ canEditSetup }: { canEditSetup: boolean }) => (
    <div data-testid="template-form">
      Template Form (canEditSetup: {String(canEditSetup)})
    </div>
  ),
}));

describe("MessagingSetupTier Component", () => {
  it("renders module tier motion and subtabs in editable mode", () => {
    const html = renderToStaticMarkup(
      <MessagingSetupTier
        canWrite={true}
        canEditSetup={true}
        onDeleteRequest={vi.fn()}
      />,
    );

    expect(html).toContain("module-tier-motion");
    expect(html).toContain("SubTabBar");
    expect(html).toContain("canEditSetup: true");
  });

  it("passes canEditSetup false to template form", () => {
    const html = renderToStaticMarkup(
      <MessagingSetupTier
        canWrite={false}
        canEditSetup={false}
        onDeleteRequest={vi.fn()}
      />,
    );

    expect(html).toContain("canEditSetup: false");
  });
});
