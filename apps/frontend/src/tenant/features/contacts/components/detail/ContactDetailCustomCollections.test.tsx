import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "@mms/shared";
import { ContactDetailCustomCollections } from "./ContactDetailCustomCollections";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockContact: Contact = {
  id: "cnt-1",
  name: "Zayd Harith",
  firstName: "Zayd",
  lastName: "Harith",
  custom_health: [
    { bloodGroup: "O+", allergies: "None" },
  ],
  type: "student",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("ContactDetailCustomCollections Component", () => {
  it("renders custom collection sections when tabs and fields are configured", () => {
    const html = renderToStaticMarkup(
      <ContactDetailCustomCollections
        contact={mockContact}
        fields={{
          custom_health: [
            { key: "bloodGroup", label: "Blood Group", type: "text", enabled: true, order: 1 },
            { key: "allergies", label: "Allergies", type: "text", enabled: true, order: 2 },
          ],
        }}
        enabledTabIds={new Set(["custom_health"])}
        formTabs={[
          { key: "custom_health", label: "Health Details", enabled: true, order: 1 },
        ]}
      />,
    );

    expect(html).toContain("Health Details");
    expect(html).toContain("Blood Group: O+");
  });
});
