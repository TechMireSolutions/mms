import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CustomizeSectionCard } from "./CustomizeSectionCard";

describe("CustomizeSectionCard Component", () => {
  it("renders fieldset with title, description, and children", () => {
    const html = renderToStaticMarkup(
      <CustomizeSectionCard
        title="Widget Visibility"
        description="Choose which cards appear on your dashboard"
        headerContent={<div>Header slot</div>}
        footer={<div>Footer slot</div>}
      >
        <div>Content slot</div>
      </CustomizeSectionCard>
    );

    expect(html).toContain("Widget Visibility");
    expect(html).toContain("Choose which cards appear on your dashboard");
    expect(html).toContain("Header slot");
    expect(html).toContain("Content slot");
    expect(html).toContain("Footer slot");
  });
});
