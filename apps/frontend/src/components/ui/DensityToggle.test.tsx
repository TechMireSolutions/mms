import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DensityToggle, type DensityMode } from "./DensityToggle";

describe("DensityToggle Component", () => {
  it("renders a radiogroup with aria-label", () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <DensityToggle density="default" onChange={vi.fn()} />
      </TooltipProvider>,
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Row density"');
  });

  it.each(["compact", "default", "relaxed"] as DensityMode[])(
    "renders %s as selected radio option",
    (activeDensity) => {
      const html = renderToStaticMarkup(
        <TooltipProvider>
          <DensityToggle density={activeDensity} onChange={vi.fn()} />
        </TooltipProvider>,
      );

      // Verify selected radio has aria-checked="true"
      expect(html).toContain(`aria-checked="true"`);
      expect(html).toContain(`aria-label="${activeDensity.charAt(0).toUpperCase() + activeDensity.slice(1)} row density"`);
    },
  );
});
