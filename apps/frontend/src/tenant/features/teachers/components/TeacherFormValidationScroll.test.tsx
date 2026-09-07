import { describe, expect, it, vi, beforeEach } from "vitest";
import { runTeacherSaveFlow } from "@/tenant/features/teachers/components/teacherFormSaveFlow";
import * as formAutoScroll from "@/lib/forms/formAutoScroll";
import type { Contact, TeachersSettings } from "@mms/shared";

vi.mock("@/lib/notify", () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/clientErrorReporting", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/tenant/features/teachers/components/teacherFormValidation", () => ({
  validateTeacherDraft: vi.fn(),
  checkTeacherFormDuplicate: vi.fn().mockResolvedValue(null),
  teacherValidationErrorsByField: (errors: Array<{ fieldId: string; message: string }>) =>
    Object.fromEntries(errors.map((e) => [e.fieldId, e.message])),
  DUPLICATE_ERROR_KEYS: {
    employeeId: "teachers.duplicate.employeeId",
  },
}));

describe("TeacherForm Validation Auto-Scroll & Contact SSOT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers scrollAndFocusFirstError with smooth center options when validation fails", async () => {
    const scrollSpy = vi.spyOn(formAutoScroll, "scrollAndFocusFirstError");
    const { validateTeacherDraft } = await import(
      "@/tenant/features/teachers/components/teacherFormValidation"
    );
    vi.mocked(validateTeacherDraft).mockReturnValue([
      { fieldId: "employeeId", message: "Employee ID is required", tabId: "basic" },
    ]);

    const setErrors = vi.fn();
    const onSave = vi.fn();

    const success = await runTeacherSaveFlow({
      teacherDraft: { contactId: "cnt-teacher-55" },
      teacher: undefined,
      autoGenerateId: false,
      formInstanceId: "inst-teacher-55",
      linkedContact: { id: "cnt-teacher-55", name: "Ustadh Bilal" } as Contact,
      settings: {} as TeachersSettings,
      enabledTabs: new Set(["basic", "employment"]),
      fields: {},
      language: "en",
      t: ((k: string) => k) as unknown as import("@/lib/contexts/TranslationContext").TranslationFunction,
      onSave,
      onClose: vi.fn(),
      setErrors,
      setSaving: vi.fn(),
      setPendingSaveData: vi.fn(),
      setTypedDuplicateReason: vi.fn(),
      setDuplicateConfirmOpen: vi.fn(),
    });

    expect(success).toBe(false);
    expect(setErrors).toHaveBeenCalledWith({
      employeeId: "Employee ID is required",
    });
    expect(scrollSpy).toHaveBeenCalledWith(
      expect.arrayContaining(["tf-inst-teacher-55-employeeId", "employeeId"]),
      { behavior: "smooth", block: "center" },
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("persists contact selection (SSOT) through successful submission", async () => {
    const { validateTeacherDraft } = await import(
      "@/tenant/features/teachers/components/teacherFormValidation"
    );
    vi.mocked(validateTeacherDraft).mockReturnValue(null);

    const onSave = vi.fn();
    const onClose = vi.fn();

    const success = await runTeacherSaveFlow({
      teacherDraft: {
        contactId: "cnt-teacher-88",
        employeeId: "EMP-2026-088",
        status: "active",
        specialization: "Fiqh",
      },
      teacher: undefined,
      autoGenerateId: false,
      formInstanceId: "inst-teacher-88",
      linkedContact: {
        id: "cnt-teacher-88",
        name: "Ustadh Hamza",
      } as Contact,
      settings: {} as TeachersSettings,
      enabledTabs: new Set(["basic", "employment"]),
      fields: {},
      language: "en",
      t: ((k: string) => k) as unknown as import("@/lib/contexts/TranslationContext").TranslationFunction,
      onSave,
      onClose,
      setErrors: vi.fn(),
      setSaving: vi.fn(),
      setPendingSaveData: vi.fn(),
      setTypedDuplicateReason: vi.fn(),
      setDuplicateConfirmOpen: vi.fn(),
    });

    expect(success).toBe(true);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        contactId: "cnt-teacher-88",
        employeeId: "EMP-2026-088",
        status: "active",
        specialization: "Fiqh",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
