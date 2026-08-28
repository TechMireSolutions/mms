import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentsSetupTier } from "./EnrollmentsSetupTier";

vi.mock("@/tenant/features/enrollments/components/EnrollmentsSettings", () => ({
  EnrollmentsSettings: () => <div data-testid="enrollments-settings">Enrollments Settings</div>,
}));

describe("EnrollmentsSetupTier Component", () => {
  it("renders EnrollmentsSettings component", () => {
    const html = renderToStaticMarkup(<EnrollmentsSetupTier />);
    expect(html).toContain("Enrollments Settings");
  });
});
