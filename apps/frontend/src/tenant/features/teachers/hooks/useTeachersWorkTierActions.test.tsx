import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useTeachersWorkTierActions,
  type UseTeachersWorkTierActionsProps,
  type UseTeachersWorkTierActionsReturn,
} from "./useTeachersWorkTierActions";
import type { Teacher } from "@mms/shared";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/tenant/features/teachers/hooks/useTeacherStatusConfig", () => ({
  useTeacherStatusConfig: () => ({
    active: { label: "Active", cls: "text-emerald-700" },
  }),
}));

function TestHarness({
  props,
  onHook,
}: {
  props: UseTeachersWorkTierActionsProps;
  onHook: (actions: UseTeachersWorkTierActionsReturn) => void;
}) {
  const actions = useTeachersWorkTierActions(props);
  onHook(actions);
  return null;
}

describe("useTeachersWorkTierActions", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mockTeacher: Teacher = {
    id: "tch-1",
    contactId: "cnt-1",
    name: "Ustadh Umar",
    status: "active",
    employeeId: "EMP-010",
    gender: "male",
    specialization: "Tajweed",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.clearAllMocks();
  });

  it("handles bulk status change and clears selection", async () => {
    const onBulkStatusChange = vi.fn().mockResolvedValue(undefined);
    const onClearSelection = vi.fn();
    let hookActions!: UseTeachersWorkTierActionsReturn;

    await act(async () => {
      root.render(
        <TestHarness
          props={{
            filterStatus: ["active"],
            filterSpecialization: "all",
            filterGender: "all",
            onToggleStatus: vi.fn(),
            onSpecializationChange: vi.fn(),
            onGenderChange: vi.fn(),
            sortField: "name",
            sortDir: "asc",
            onSortChange: vi.fn(),
            selectedIds: ["tch-1"],
            teachers: [mockTeacher],
            onBulkStatusChange,
            onClearSelection,
          }}
          onHook={(actions) => {
            hookActions = actions;
          }}
        />,
      );
    });

    await act(async () => {
      await hookActions.handleBulkStatusChange("inactive");
    });

    expect(onBulkStatusChange).toHaveBeenCalledWith(["tch-1"], "inactive");
    expect(onClearSelection).toHaveBeenCalled();
  });

  it("handles sort field change with direction toggling", async () => {
    const onSortChange = vi.fn();
    let hookActions!: UseTeachersWorkTierActionsReturn;

    await act(async () => {
      root.render(
        <TestHarness
          props={{
            filterStatus: [],
            filterSpecialization: "all",
            filterGender: "all",
            onToggleStatus: vi.fn(),
            onSpecializationChange: vi.fn(),
            onGenderChange: vi.fn(),
            sortField: "name",
            sortDir: "asc",
            onSortChange,
            selectedIds: [],
            teachers: [mockTeacher],
            onClearSelection: vi.fn(),
          }}
          onHook={(actions) => {
            hookActions = actions;
          }}
        />,
      );
    });

    // Clicking the same field toggles direction to desc
    act(() => {
      hookActions.handleSortFieldChange("name");
    });
    expect(onSortChange).toHaveBeenCalledWith("name", "desc");

    // Clicking a different field defaults to asc
    act(() => {
      hookActions.handleSortFieldChange("employeeId");
    });
    expect(onSortChange).toHaveBeenCalledWith("employeeId", "asc");
  });
});
