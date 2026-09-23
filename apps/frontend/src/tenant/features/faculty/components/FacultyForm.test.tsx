import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FacultyForm, TeacherForm } from "./FacultyForm";

let mockControllerState = {
  errors: {} as Record<string, string>,
  isFieldEnabled: (_fieldId: string) => true,
};

vi.mock("@/tenant/features/faculty/components/useFacultyFormController", () => ({
  useTeacherFormController: () => ({
    t: (key: string) => key,
    dir: "ltr",
    language: "en",
    saving: false,
    errors: mockControllerState.errors,
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
    isFieldEnabled: mockControllerState.isFieldEnabled,
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
  FormModal: ({
    title,
    children,
    footerStart,
    tabs,
    activeTab,
  }: {
    title: string;
    children: React.ReactNode;
    footerStart: React.ReactNode;
    tabs?: Array<{ key: string; label: string; badge?: number; tone?: string }>;
    activeTab?: string;
  }) => (
    <div data-testid="form-modal" data-active-tab={activeTab}>
      <h1>{title}</h1>
      <div data-testid="modal-tabs">
        {tabs?.map((t) => (
          <span key={t.key} data-tab-key={t.key} data-badge={t.badge}>
            {t.label}
          </span>
        ))}
      </div>
      <div>{footerStart}</div>
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/tenant/features/faculty/components/FacultyFormTabContent", () => ({
  TeacherFormTabContent: ({ activeTab }: { activeTab?: string }) => (
    <div data-testid="teacher-form-tab-content" data-current-tab={activeTab}>
      Teacher Tab Content: {activeTab}
    </div>
  ),
}));

describe("TeacherForm Component", () => {
  it("renders teacher form modal with title, footer, and tab content", () => {
    mockControllerState = {
      errors: {},
      isFieldEnabled: () => true,
    };

    const html = renderToStaticMarkup(
      <TeacherForm onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(html).toContain("teachers.form.addTitle");
    expect(html).toContain("Ustadh Umar");
    expect(html).toContain("Teacher Tab Content: contact");
  });

  it("provides tabs for contact, employment, designation, hierarchy, account, and notes", () => {
    mockControllerState = {
      errors: {},
      isFieldEnabled: () => true,
    };

    const html = renderToStaticMarkup(
      <FacultyForm onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(html).toContain('data-tab-key="contact"');
    expect(html).toContain('data-tab-key="employment"');
    expect(html).toContain('data-tab-key="designation"');
    expect(html).toContain('data-tab-key="hierarchy"');
    expect(html).toContain('data-tab-key="account"');
    expect(html).toContain('data-tab-key="notes"');
  });

  it("calculates tab error counts and displays error badges on affected tabs", () => {
    mockControllerState = {
      errors: {
        employeeId: "Employee ID required",
        designationStartsOn: "Start date required",
      },
      isFieldEnabled: () => true,
    };

    const html = renderToStaticMarkup(
      <FacultyForm onClose={vi.fn()} onSave={vi.fn()} />,
    );

    expect(html).toContain('data-tab-key="employment" data-badge="1"');
    expect(html).toContain('data-tab-key="designation" data-badge="1"');
    expect(html).toContain('data-tab-key="contact"');
    expect(html).not.toContain('data-tab-key="contact" data-badge');
  });
});
