import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";

describe("PersonDetailHeroCard Component", () => {
  it("renders display name and avatar initials", () => {
    const html = renderToStaticMarkup(
      <PersonDetailHeroCard
        id="usr-1"
        displayName="Syeda Fatima"
        gender="female"
        accentColor="secondary"
      />,
    );

    expect(html).toContain("Syeda Fatima");
    expect(html).toContain("SF");
    expect(html).toContain('title="Syeda Fatima"');
  });

  it("renders meta row when children are provided", () => {
    const html = renderToStaticMarkup(
      <PersonDetailHeroCard
        id="usr-2"
        displayName="Ali Raza"
        gender="male"
      >
        <span id="badge-active">Active</span>
        <span id="badge-gr">GR-100</span>
      </PersonDetailHeroCard>,
    );

    expect(html).toContain("Ali Raza");
    expect(html).toContain("badge-active");
    expect(html).toContain("badge-gr");
  });

  it("applies custom className", () => {
    const html = renderToStaticMarkup(
      <PersonDetailHeroCard
        id="usr-3"
        displayName="Test User"
        className="custom-hero-class"
      />,
    );

    expect(html).toContain("custom-hero-class");
  });
});
