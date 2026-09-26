import { describe, expect, it, vi } from "vitest";
import {
  focusTeacherValidationField,
  focusFacultyValidationField,
  teacherValidationErrorsByField,
  facultyValidationErrorsByField,
  validateTeacherDraft,
  validateFacultyDraft,
  checkTeacherFormDuplicate,
  checkFacultyFormDuplicate,
  DUPLICATE_ERROR_KEYS,
  FACULTY_DUPLICATE_ERROR_KEYS,
} from "./facultyFormValidation";
import * as formAutoScroll from "@/lib/forms/formAutoScroll";
import * as useFacultyModule from "@/tenant/features/faculty/hooks/useFaculty";

vi.mock("@/lib/forms/formAutoScroll", () => ({
  scrollAndFocusFirstError: vi.fn(),
}));

vi.mock("@/tenant/features/faculty/hooks/useFaculty", () => ({
  checkTeacherRegistrationDuplicate: vi.fn(),
}));

describe("facultyFormValidation", () => {
  describe("DUPLICATE_ERROR_KEYS", () => {
    it("exposes canonical faculty keys with backward-compatible alias", () => {
      expect(DUPLICATE_ERROR_KEYS.contact).toBe("faculty.form.contactAlreadyTeacher");
      expect(DUPLICATE_ERROR_KEYS.employeeId).toBe("faculty.form.duplicateEmployeeId");
      expect(FACULTY_DUPLICATE_ERROR_KEYS).toBe(DUPLICATE_ERROR_KEYS);
    });
  });

  describe("focusTeacherValidationField / focusFacultyValidationField", () => {
    it("calls scrollAndFocusFirstError with proper candidate IDs and aliases", () => {
      focusFacultyValidationField("inst-1", "user.role");
      expect(formAutoScroll.scrollAndFocusFirstError).toHaveBeenCalledWith(
        expect.arrayContaining(["tf-inst-1-user.role", "user.role", "faculty-user-role", "linked-user-role"]),
        { behavior: "smooth", block: "center" },
      );
    });

    it("focusTeacherValidationField behaves identically to focusFacultyValidationField", () => {
      expect(focusFacultyValidationField).toBe(focusTeacherValidationField);
    });
  });

  describe("teacherValidationErrorsByField / facultyValidationErrorsByField", () => {
    it("maps validation errors by fieldId taking the first error per field", () => {
      const errors = [
        { fieldId: "name", message: "Name is required", tabId: "basic" },
        { fieldId: "name", message: "Name is too short", tabId: "basic" },
        { fieldId: "employeeId", message: "Employee ID is required", tabId: "basic" },
      ];

      const mapped = facultyValidationErrorsByField(errors);
      expect(mapped).toEqual({
        name: "Name is required",
        employeeId: "Employee ID is required",
      });
      expect(facultyValidationErrorsByField).toBe(teacherValidationErrorsByField);
    });
  });

  describe("checkTeacherFormDuplicate / checkFacultyFormDuplicate", () => {
    it("delegates to checkTeacherRegistrationDuplicate with trimmed employeeId and string IDs", async () => {
      vi.mocked(useFacultyModule.checkTeacherRegistrationDuplicate).mockResolvedValueOnce("employeeId");

      const result = await checkFacultyFormDuplicate({
        teacherId: "tch-1",
        contactId: "cnt-1",
        employeeId: "  EMP-100  ",
      });

      expect(useFacultyModule.checkTeacherRegistrationDuplicate).toHaveBeenCalledWith({
        excludeId: "tch-1",
        contactId: "cnt-1",
        employeeId: "EMP-100",
      });
      expect(result).toBe("employeeId");
      expect(checkFacultyFormDuplicate).toBe(checkTeacherFormDuplicate);
    });
  });

  describe("validateTeacherDraft / validateFacultyDraft", () => {
    it("validates valid draft returning null for errors", () => {
      const result = validateFacultyDraft(
        {
          name: "Ustadh Umar",
          contactId: "cnt-1",
          employeeId: "EMP-001",
          joinDate: "2024-01-01",
          status: "active",
          specialization: "Tajweed",
        },
        {
          settings: {
            employeeIdAutoGenerate: false,
            requireContactLink: true,
            defaultSpecialization: "",
            defaultStatus: "active",
          } as any,
          enabledTabs: new Set(["basic", "employment"]),
          fields: {},
          language: "en",
        },
      );

      expect(result).toBeNull();
      expect(validateFacultyDraft).toBe(validateTeacherDraft);
    });
  });
});
