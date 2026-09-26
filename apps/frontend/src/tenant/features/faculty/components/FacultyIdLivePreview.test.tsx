import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyIdLivePreview } from "./FacultyIdLivePreview";

describe("FacultyIdLivePreview Component", () => {
  it("renders live preview badge and template formula label", () => {
    const html = renderToStaticMarkup(
      <FacultyIdLivePreview
        livePreview="FAC-2026-0001"
        formulaTemplate="{PREFIX}-{YYYY}-{SEQ}"
        previewLabel="Live Preview"
        templateLabel="Format Template"
      />,
    );

    expect(html).toContain("Live Preview");
    expect(html).toContain("Format Template");
    expect(html).toContain("FAC-2026-0001");
    expect(html).toContain("{PREFIX}-{YYYY}-{SEQ}");
  });
});
