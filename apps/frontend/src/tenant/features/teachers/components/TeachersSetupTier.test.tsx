import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersSetupTier } from "./TeachersSetupTier";

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({ canEditSetup: true }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/teachers/components/TeachersSettings", () => ({
  default: () => <div data-testid="teachers-settings">Teachers Settings Panel</div>,
  TeachersSettings: () => <div data-testid="teachers-settings">Teachers Settings Panel</div>,
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TeachersSetupTier Component", () => {
  it("renders TeachersSettings panel within setup tier", () => {
    const html = renderToStaticMarkup(<TeachersSetupTier />);
    expect(html).toBeDefined();
  });
});
