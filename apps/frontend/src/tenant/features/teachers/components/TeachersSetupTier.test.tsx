import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeachersSetupTier } from "./TeachersSetupTier";

vi.mock("@/tenant/features/teachers/components/TeachersSettings", () => ({
  TeachersSettings: () => <div data-testid="teachers-settings">Teachers Settings Panel</div>,
}));

vi.mock("@/components/ui/ModuleTierMotion", () => ({
  ModuleTierMotion: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TeachersSetupTier Component", () => {
  it("renders TeachersSettings panel within setup tier", () => {
    const html = renderToStaticMarkup(<TeachersSetupTier />);
    expect(html).toContain("Teachers Settings Panel");
  });
});
