import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactRelationshipTab } from "./ContactRelationshipTab";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./ContactSubListCards", () => ({
  ContactSubListShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sublist-shell">{children}</div>
  ),
  ListFieldCard: ({ children, typeSelect }: {
    children: React.ReactNode;
    typeSelect?: React.ReactNode;
  }) => (
    <div data-testid="list-field-card">
      <div>{typeSelect}</div>
      <div>{children}</div>
    </div>
  ),
  resolveSubListAllowAdd: () => true,
}));

vi.mock("@/components/ui/FormPrimitives", () => ({
  EditableSelect: ({ value }: { value?: string }) => <div data-testid="editable-select">{value}</div>,
  FieldErrorMessage: () => null,
}));

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: ({ label }: { label: string }) => <div data-testid="contact-picker">{label}</div>,
}));

describe("ContactRelationshipTab Component", () => {
  it("renders relationships sublist", () => {
    const html = renderToStaticMarkup(
      <ContactRelationshipTab
        contactDraft={{
          relationshipContacts: [{ contactId: "cnt-2", relationship: "Brother" }],
        }}
        formInstanceId="inst-1"
        getLocalId={() => "loc-1"}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        getListItemError={() => undefined}
        fields={{}}
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
      />,
    );

    expect(html).toContain("contacts.form.relationshipInstructions");
    expect(html).toContain("Brother");
    expect(html).toContain("contacts.form.linkContact");
  });
});
