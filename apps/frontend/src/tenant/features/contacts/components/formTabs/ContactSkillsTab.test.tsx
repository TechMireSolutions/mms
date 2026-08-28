import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactSkillsTab } from "./ContactSkillsTab";

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
  Field: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div data-testid="field">
      <label>{label}</label>
      {children}
    </div>
  ),
  EditableSelect: ({ value }: { value?: string }) => (
    <div data-testid="editable-select">{value}</div>
  ),
  FormCheckboxCard: ({ label, checked }: { label: string; checked: boolean }) => (
    <div data-testid="checkbox-card">{label}: {checked ? "yes" : "no"}</div>
  ),
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ value }: { value?: string }) => <textarea data-testid="textarea" value={value || ""} readOnly />,
}));

describe("ContactSkillsTab Component", () => {
  it("renders skills sublist", () => {
    const html = renderToStaticMarkup(
      <ContactSkillsTab
        contactDraft={{
          skills: [
            {
              name: "Arabic Grammar",
              category: "Language",
              proficiency: "Expert",
              yearsOfExperience: "5",
              isCertified: true,
              issuer: "Al-Azhar",
            },
          ],
        }}
        getLocalId={() => "loc-1"}
        categoryOptions={["Language", "Technical"]}
        proficiencyOptions={["Beginner", "Expert"]}
        formInstanceId="inst-1"
        getListItemError={() => undefined}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        fields={{}}
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
      />,
    );

    expect(html).toContain("Arabic Grammar");
    expect(html).toContain("Language");
    expect(html).toContain("Al-Azhar");
  });
});
