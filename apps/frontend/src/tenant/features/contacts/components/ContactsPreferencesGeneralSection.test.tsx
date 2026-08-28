import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_CONTACT_PREFERENCES } from "@mms/shared";
import { ContactsPreferencesGeneralSection } from "./ContactsPreferencesGeneralSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ContactsPreferencesGeneralSection Component", () => {
  it("renders country/city/province inputs and detailed age toggles", () => {
    const html = renderToStaticMarkup(
      <ContactsPreferencesGeneralSection
        prefs={DEFAULT_CONTACT_PREFERENCES}
        countryOptions={[{ value: "PK", label: "Pakistan" }]}
        onUpdatePreference={vi.fn()}
      />,
    );

    expect(html).toContain("contacts.setup.generalPreferences");
    expect(html).toContain("contacts.setup.defaultCountry");
    expect(html).toContain("contacts.setup.showDetailedSolarAge");
    expect(html).toContain("contacts.setup.showLunarDob");
    expect(html).toContain("contacts.setup.showDetailedLunarAge");
  });
});
