import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBasicAvatarSection } from "./ContactBasicAvatarSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/contacts/components/ContactIdentityMeta", () => ({
  ContactIdentityMeta: () => <div data-testid="identity-meta">Identity Meta</div>,
}));

describe("ContactBasicAvatarSection Component", () => {
  it("renders avatar preview and change photo trigger", () => {
    const html = renderToStaticMarkup(
      <ContactBasicAvatarSection
        contactDraft={{ firstName: "Zayd", lastName: "Harith", gender: "male" }}
        formInstanceId="inst-1"
        cropSrc={null}
        setCropSrc={vi.fn()}
        updateDraft={vi.fn()}
        handleAvatarChange={vi.fn()}
      />,
    );

    expect(html).toContain("Zayd Harith");
    expect(html).toContain("Identity Meta");
  });
});
