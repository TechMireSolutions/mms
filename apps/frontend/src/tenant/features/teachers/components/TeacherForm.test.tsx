import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TeacherForm } from "./TeacherForm";

vi.mock("@/tenant/features/teachers/components/useTeacherFormController", () => ({
  useTeacherFormController: () => ({
    t: (key: string) => key,
    dir: "ltr",
    language: "en",
    saving: false,
    errors: {},
    teacherDraft: { contactId: "cnt-1", employeeId: "EMP-01", status: "active" },
    isDirty: false,
    defaultSpecialization: "Tajweed",
    specializationOptions: [],
    statusOptions: [],
    statusConfig: {},
    autoGenerateId: false,
    requireContactLink: false,
    fieldsMap: {},
    linkedContact: { id: "cnt-1", name: "Ustadh Umar" },
    linkedTeacherContactIds: [],
    idPrefix: "TCH-",
    formInstanceId: "test-tch-inst",
    activeTab: "basic",
    setActiveTab: vi.fn(),
    visibleTabs: [{ id: "basic", label: "Basic Details" }],
    isFieldEnabled: () => true,
    isFieldRequired: () => false,
    getFieldError: () => undefined,
    updateDraft: vi.fn(),
    handleSave: vi.fn(),
    validationErrorSummary: undefined,
    typedDuplicateReason: undefined,
    duplicateConfirmOpen: false,
    handleDuplicateDialogOpenChange: vi.fn(),
    confirmDuplicateSave: vi.fn(),
    duplicateErrorKeys: {},
  }),
}));

vi.mock("@/components/ui/FormModal", () => ({
  FormModal: ({ title, children, footerStart }: { title: string; children: React.ReactNode; footerStart: React.ReactNode }) => (
    <div data-testid="form-modal">
      <h1>{title}</h1>
      <div>{footerStart}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/tenant/features/teachers/components/TeacherFormTabContent", () => ({
  TeacherFormTabContent: () => <div data-testid="teacher-form-tab-content">Teacher Tab Content</div>,
}));

describe("TeacherForm Component", () => {
  it("renders teacher form modal with title, footer, and tab content", () => {
    const html = renderToStaticMarkup(
      <TeacherForm onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(html).toContain("teachers.form.addTitle");
    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("Teacher Tab Content");
  });
});
