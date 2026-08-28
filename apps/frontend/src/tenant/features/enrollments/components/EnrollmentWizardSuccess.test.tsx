import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EnrollmentWizardSuccess } from "./EnrollmentWizardSuccess";

describe("EnrollmentWizardSuccess Component", () => {
  it("renders success submission message", () => {
    const html = renderToStaticMarkup(
      <EnrollmentWizardSuccess
        t={((k: string) => k) as any}
        student={{ id: "std-1", name: "Bilal Ahmad" } as any}
        session={{ id: "ses-1", name: "Spring 2025" } as any}
      />,
    );

    expect(html).toContain("enrollments.wizard.submittedTitle");
    expect(html).toContain("enrollments.wizard.submittedSubtitle");
  });
});
