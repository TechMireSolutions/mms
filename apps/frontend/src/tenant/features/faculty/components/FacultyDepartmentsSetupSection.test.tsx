import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FacultyDepartmentsSetupSection } from "./FacultyDepartmentsSetupSection";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockSaveMutateAsync = vi.fn().mockResolvedValue({ id: "dept-3", name: "Fiqh & Law", code: "fiqh-law" });
const mockDeleteMutateAsync = vi.fn().mockResolvedValue(undefined);
let mockDepartmentsData = [
  { id: "dept-1", workspaceSubdomain: "tenant", name: "Quranic Studies", code: "quranic-studies" },
  { id: "dept-2", workspaceSubdomain: "tenant", name: "Hadith Sciences", code: "hadith-sciences" },
];

vi.mock("@/tenant/features/faculty/hooks/useFacultyDepartments", () => ({
  useFacultyDepartments: () => ({
    data: mockDepartmentsData,
    isLoading: false,
  }),
  useSaveFacultyDepartment: () => ({
    mutateAsync: mockSaveMutateAsync,
    isPending: false,
  }),
  useDeleteFacultyDepartment: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/notify", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("FacultyDepartmentsSetupSection", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockSaveMutateAsync.mockClear();
    mockDeleteMutateAsync.mockClear();
    mockDepartmentsData = [
      { id: "dept-1", workspaceSubdomain: "tenant", name: "Quranic Studies", code: "quranic-studies" },
      { id: "dept-2", workspaceSubdomain: "tenant", name: "Hadith Sciences", code: "hadith-sciences" },
    ];
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders existing departments and input field", async () => {
    await act(async () => {
      root.render(<FacultyDepartmentsSetupSection />);
    });

    expect(container.textContent).toContain("faculty.setup.departmentsTitle");
    expect(container.textContent).toContain("Quranic Studies");
    expect(container.textContent).toContain("Hadith Sciences");

    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    expect(container.textContent).toContain("faculty.setup.departmentName");
    expect(container.textContent).toContain("faculty.setup.departmentCode");
    expect(container.textContent).toContain("faculty.setup.parentDepartment");

    const inputName = container.querySelector<HTMLInputElement>("input#new-faculty-department-name");
    const inputCode = container.querySelector<HTMLInputElement>("input#new-faculty-department-code");
    expect(inputName).not.toBeNull();
    expect(inputCode).not.toBeNull();
  });

  it("adds a new department when form is submitted", async () => {
    await act(async () => {
      root.render(<FacultyDepartmentsSetupSection />);
    });

    const inputName = container.querySelector<HTMLInputElement>("input#new-faculty-department-name")!;
    const form = container.querySelector<HTMLFormElement>("form")!;

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(inputName, "Fiqh & Law");
      inputName.dispatchEvent(new Event("input", { bubbles: true }));
      inputName.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Fiqh & Law",
        code: "fiqh-law",
      }),
    );
  });

  it("edits an existing department when edit button is clicked and form is submitted", async () => {
    await act(async () => {
      root.render(<FacultyDepartmentsSetupSection />);
    });

    const editBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.edit Quranic Studies"]',
    );
    expect(editBtn).not.toBeNull();

    await act(async () => {
      editBtn!.click();
    });

    const inputName = container.querySelector<HTMLInputElement>("input#new-faculty-department-name")!;
    expect(inputName.value).toBe("Quranic Studies");

    const form = container.querySelector<HTMLFormElement>("form")!;
    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(inputName, "Advanced Quranic Studies");
      inputName.dispatchEvent(new Event("input", { bubbles: true }));
      inputName.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockSaveMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "dept-1",
        name: "Advanced Quranic Studies",
        code: "quranic-studies",
      }),
    );
  });

  it("removes an existing department when delete button is clicked", async () => {
    await act(async () => {
      root.render(<FacultyDepartmentsSetupSection />);
    });

    const deleteBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="common.delete Quranic Studies"]',
    );
    expect(deleteBtn).not.toBeNull();

    await act(async () => {
      deleteBtn!.click();
    });

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("dept-1");
  });
});
