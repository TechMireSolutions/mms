import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactRelationshipTab, STATIC_RELATIONSHIP_OPTIONS } from "./ContactRelationshipTab";

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
  FormSelect: ({ value, options, id, name }: {
    value?: string;
    options: readonly ({ value: string; label: string } | string)[];
    id?: string;
    name?: string;
  }) => (
    <select data-testid="form-select" data-value={value} id={id} name={name}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const lbl = typeof opt === "string" ? opt : opt.label;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  ),
  EditableSelect: ({ value }: { value?: string }) => <div data-testid="editable-select">{value}</div>,
  FieldErrorMessage: () => null,
}));

vi.mock("@/components/contactLink/ContactPicker", () => ({
  default: ({ label }: { label: string }) => <div data-testid="contact-picker">{label}</div>,
}));

describe("ContactRelationshipTab Component", () => {
  it("exports strictly 6 hardcoded relationship options matching relationship pairs", () => {
    expect(STATIC_RELATIONSHIP_OPTIONS).toEqual([
      "Parent",
      "Child",
      "Husband",
      "Wife",
      "Guardian",
      "Dependent",
    ]);
  });

  it("renders relationships sublist with FormSelect and hardcoded options", () => {
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
    expect(html).toContain("data-testid=\"form-select\"");
    expect(html).toContain("Parent");
    expect(html).toContain("Child");
    expect(html).toContain("Husband");
    expect(html).toContain("Wife");
    expect(html).toContain("Guardian");
    expect(html).toContain("Dependent");
    expect(html).toContain("Brother");
    expect(html).toContain("contacts.form.linkContact");
  });
});

