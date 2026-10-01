import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FacultyDepartmentsSetupSection } from "./FacultyDepartmentsSetupSection";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });
let mockLookupsData: { departments?: string[] } | undefined = {
  departments: ["Quranic Studies", "Hadith Sciences"],
};

vi.mock("@/tenant/features/faculty/hooks/useFacultyLookups", () => ({
  useFacultyLookupsQuery: () => ({
    data: mockLookupsData,
    isLoading: false,
  }),
  useFacultyLookupMutation: () => ({
    mutateAsync: mockMutateAsync,
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
    mockMutateAsync.mockClear();
    mockLookupsData = { departments: ["Quranic Studies", "Hadith Sciences"] };
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

    const input = container.querySelector<HTMLInputElement>("input#new-faculty-department");
    expect(input).not.toBeNull();
  });

  it("adds a new department when form is submitted", async () => {
    await act(async () => {
      root.render(<FacultyDepartmentsSetupSection />);
    });

    const input = container.querySelector<HTMLInputElement>("input#new-faculty-department")!;
    const form = container.querySelector<HTMLFormElement>("form")!;

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(input, "Fiqh & Law");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      kind: "departments",
      items: ["Quranic Studies", "Hadith Sciences", "Fiqh & Law"],
    });
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

    expect(mockMutateAsync).toHaveBeenCalledWith({
      kind: "departments",
      items: ["Hadith Sciences"],
    });
  });
});
