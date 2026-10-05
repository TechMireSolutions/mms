import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { FacultyMember } from "@mms/shared";
import { FacultyAssignmentsSection } from "./FacultyAssignmentsSection";

const { controllerState, assignment } = vi.hoisted(() => {
  const assignment = {
    id: "asgn-1",
    facultyId: "fac-1",
    departmentId: "dept-1",
    departmentName: "Fiqh",
    designationId: "des-1",
    designationName: "Head",
    positionId: "pos-1",
    isPrimary: true,
    status: "active" as const,
    startDate: "2026-01-01",
    endDate: null,
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    workspaceSubdomain: "demo",
  };

  const base = {
    assignments: [assignment],
    isPending: false,
    isError: false,
    refetch: vi.fn(async () => undefined),
    mode: "idle" as "idle" | "add" | "edit",
    form: {
      id: "",
      departmentId: "",
      designationId: "",
      positionId: "",
      originalPositionId: "",
      isPrimary: false,
      startDate: "",
      endDate: "",
      notes: "",
    },
    setForm: vi.fn(),
    departmentOptions: [] as Array<{ value: string; label: string }>,
    designationOptions: [] as Array<{ value: string; label: string }>,
    positionOptions: [] as Array<{ value: string; label: string }>,
    positionNameById: new Map([["pos-1", "Dean"]]),
    requiresPosition: true,
    allowEmptyPosition: false,
    showLegacyPositionWarning: false,
    isBusy: false,
    reset: vi.fn(),
    openEdit: vi.fn(),
    openAdd: vi.fn(),
    handleSubmit: vi.fn(async () => undefined),
    handleClose: vi.fn(async () => undefined),
    handleDelete: vi.fn(async () => undefined),
  };

  return { controllerState: { current: base }, assignment };
});

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("../hooks/useFacultyFormCatalogQuickCreate", () => ({
  useFacultyFormCatalogQuickCreate: () => ({
    createDepartmentOpen: false,
    createDesignationOpen: false,
    closeDepartment: vi.fn(),
    closeDesignation: vi.fn(),
    openCreateDepartment: vi.fn(),
    openCreateDesignation: vi.fn(),
    applyDepartmentCreated: vi.fn(),
    applyDesignationCreated: vi.fn(),
  }),
}));

vi.mock("@/tenant/components/organization/OrganizationPositionFormModal", () => ({
  OrganizationPositionFormModal: () => null,
}));

vi.mock("./FacultyCatalogCreateOverlays", () => ({
  FacultyCatalogCreateOverlays: () => null,
}));

vi.mock("./FacultyAssignmentFormModal", () => ({
  FacultyAssignmentFormModal: ({ open }: { open: boolean }) =>
    open ? <div>assignment-modal-open</div> : null,
}));

vi.mock("./FacultyAssignmentReportingChain", () => ({
  FacultyAssignmentReportingChain: () => null,
}));

vi.mock("./FacultyAssignmentSubordinates", () => ({
  FacultyAssignmentSubordinates: () => null,
}));

vi.mock("../hooks/useFacultyAssignmentsController", () => ({
  useFacultyAssignmentsController: () => controllerState.current,
}));

const faculty = { id: "fac-1", name: "Teacher" } as FacultyMember;

describe("FacultyAssignmentsSection", () => {
  it("renders appointment list with count when data is ready", () => {
    controllerState.current = {
      ...controllerState.current,
      assignments: [assignment],
      isPending: false,
      isError: false,
      mode: "idle",
    };
    const html = renderToStaticMarkup(
      <FacultyAssignmentsSection faculty={faculty} canEdit />,
    );
    expect(html).toContain("faculty.assignments.title");
    expect(html).toContain(">1<");
    expect(html).toContain("Head");
    expect(html).not.toContain("assignment-modal-open");
  });

  it("shows empty state when there are no appointments", () => {
    controllerState.current = {
      ...controllerState.current,
      assignments: [],
      isPending: false,
      isError: false,
      mode: "idle",
    };
    const html = renderToStaticMarkup(
      <FacultyAssignmentsSection faculty={faculty} canEdit />,
    );
    expect(html).toContain("faculty.assignments.emptyTitle");
  });

  it("shows error state when the query failed", () => {
    controllerState.current = {
      ...controllerState.current,
      assignments: [],
      isPending: false,
      isError: true,
      mode: "idle",
    };
    const html = renderToStaticMarkup(
      <FacultyAssignmentsSection faculty={faculty} canEdit />,
    );
    expect(html).toContain("faculty.loadFailed");
  });

  it("opens the assignment modal when mode is add", () => {
    controllerState.current = {
      ...controllerState.current,
      assignments: [assignment],
      isPending: false,
      isError: false,
      mode: "add",
    };
    const html = renderToStaticMarkup(
      <FacultyAssignmentsSection faculty={faculty} canEdit />,
    );
    expect(html).toContain("assignment-modal-open");
  });
});
