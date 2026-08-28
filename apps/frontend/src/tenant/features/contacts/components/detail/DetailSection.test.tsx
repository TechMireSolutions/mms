import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DetailSection, FieldGroupCard } from "./DetailSection";

describe("DetailSection & FieldGroupCard Components", () => {
  it("renders DetailSection with title and card content", () => {
    const html = renderToStaticMarkup(
      <DetailSection title="General Information">
        <p>Some content</p>
      </DetailSection>,
    );

    expect(html).toContain("General Information");
    expect(html).toContain("Some content");
  });

  it("renders FieldGroupCard with valid fields", () => {
    const html = renderToStaticMarkup(
      <FieldGroupCard
        group="Identity"
        fields={[{ key: "gender", label: "Gender", type: "text" }]}
        formatValue={() => "Male"}
        getRawValue={() => "male"}
      />,
    );

    expect(html).toContain("Identity");
    expect(html).toContain("Gender");
    expect(html).toContain("Male");
  });
});
