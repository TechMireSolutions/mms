import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { User, Shield, Lock } from "lucide-react";
import { WizardStepIndicator, type WizardStepItem } from "@/components/ui/WizardStepIndicator";

describe("WizardStepIndicator", () => {
  const steps: WizardStepItem[] = [
    { id: 1, label: "Profile", icon: User },
    { id: 2, label: "Security", icon: Shield },
    { id: 3, label: "Confirm", icon: Lock },
  ];

  it("renders all steps and marks current step with aria-current", () => {
    const html = renderToStaticMarkup(
      <WizardStepIndicator steps={steps} current={2} ariaLabel="Setup steps" />
    );

    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="Setup steps"');
    expect(html).toContain('Profile');
    expect(html).toContain('Security');
    expect(html).toContain('Confirm');
    expect(html).toContain('aria-current="step"');
  });

  it("handles string ids seamlessly", () => {
    const stringSteps: WizardStepItem[] = [
      { id: "personal", label: "Personal" },
      { id: "details", label: "Details" },
    ];

    const html = renderToStaticMarkup(
      <WizardStepIndicator steps={stringSteps} current="personal" />
    );
    expect(html).toContain('Personal');
    expect(html).toContain('Details');
    expect(html).toContain('aria-current="step"');
  });
});
