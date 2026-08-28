import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBasicIdentityFields } from "./ContactBasicIdentityFields";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/FormPrimitives", () => ({
  Field: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div data-testid="form-field">
      <label>{label}</label>
      {children}
    </div>
  ),
  EditableSelect: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="editable-select">{placeholder}</div>
  ),
}));

vi.mock("./ContactBasicMetaFields", () => ({
  ContactBasicMetaFields: () => <div data-testid="meta-fields">Meta Fields</div>,
}));

describe("ContactBasicIdentityFields Component", () => {
  it("renders firstName, lastName, and gender fields", () => {
    const html = renderToStaticMarkup(
      <ContactBasicIdentityFields
        contactDraft={{ firstName: "Zayd", lastName: "Harith", gender: "male" }}
        formInstanceId="inst-1"
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        getFieldError={() => undefined}
        updateDraft={vi.fn()}
        genders={["male", "female"]}
        onUpdateGenders={vi.fn()}
        lockGender={false}
      />,
    );

    expect(html).toContain("contacts.fields.firstName");
    expect(html).toContain("contacts.fields.lastName");
    expect(html).toContain("contacts.fields.gender");
    expect(html).toContain("Meta Fields");
  });
});
