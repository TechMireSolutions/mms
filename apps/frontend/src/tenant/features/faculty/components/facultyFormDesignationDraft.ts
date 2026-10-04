import type { FacultyDesignationHolding, FacultyMember } from "@mms/shared";
import { todayISO } from "@mms/shared";

export interface FacultyDesignationDraftRow {
  key: string;
  department: string;
  departmentId: string;
  designationId: string;
  status: "active" | "inactive";
  startsOn: string;
  endsOn: string;
}

function newRowKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `des-row-${Math.random().toString(36).slice(2)}`;
}

/** Seed designation rows from hydrated holdings or legacy singular fields. */
export function getInitialDesignationRows(
  faculty?: Partial<FacultyMember> | null,
): FacultyDesignationDraftRow[] {
  const holdings = faculty?.designations;
  if (Array.isArray(holdings) && holdings.length > 0) {
    return holdings.map((holding) => ({
      key: newRowKey(),
      department: holding.departmentName ?? faculty?.department ?? "",
      departmentId: holding.departmentId ?? "",
      designationId: holding.designationId,
      status: holding.status === "inactive" ? "inactive" : "active",
      startsOn: holding.startsOn ?? faculty?.designationStartsOn ?? todayISO(),
      endsOn: holding.endsOn ?? faculty?.designationEndsOn ?? "",
    }));
  }
  return [
    {
      key: newRowKey(),
      department: faculty?.department ?? "",
      departmentId: typeof faculty?.departmentId === "string" ? faculty.departmentId : "",
      designationId: faculty?.designationId ?? "",
      status: "active",
      startsOn: faculty?.designationStartsOn ?? todayISO(),
      endsOn: faculty?.designationEndsOn ?? "",
    },
  ];
}

/** Map draft rows to the create/hydrate designations payload. */
export function toDesignationHoldings(
  rows: FacultyDesignationDraftRow[],
): FacultyDesignationHolding[] {
  const filled = rows.filter(
    (row) => row.designationId.trim().length > 0 && row.departmentId.trim().length > 0,
  );
  let primaryAssigned = false;
  return filled.map((row) => {
    const isPrimary = row.status === "active" && !primaryAssigned;
    if (isPrimary) primaryAssigned = true;
    return {
      designationId: row.designationId.trim(),
      departmentId: row.departmentId.trim(),
      status: row.status,
      startsOn: row.startsOn.trim() || undefined,
      endsOn: row.endsOn.trim() ? row.endsOn.trim() : null,
      isPrimary,
    };
  });
}

export interface SyncPrimaryDesignationOptions {
  designationOptions: Array<{ id: string; name: string; assignableRoles?: string[] }>;
  departmentEntities?: Array<{ id: string; name: string }>;
}

/** Sync singular faculty fields from the primary Active holding. */
export function syncPrimaryDesignationPatch(
  rows: FacultyDesignationDraftRow[],
  options: SyncPrimaryDesignationOptions,
): Partial<FacultyMember> {
  const holdings = toDesignationHoldings(rows);
  const primaryHolding = holdings.find((h) => h.isPrimary) ?? holdings[0];
  const primaryRow = primaryHolding
    ? rows.find(
      (row) =>
        row.designationId === primaryHolding.designationId
        && row.departmentId === (primaryHolding.departmentId ?? ""),
    )
    : rows[0];
  const def = primaryHolding
    ? options.designationOptions.find((item) => item.id === primaryHolding.designationId)
    : undefined;
  const dept = primaryRow?.department
    || options.departmentEntities?.find((d) => d.id === primaryRow?.departmentId)?.name
    || "";

  return {
    designations: holdings,
    designationId: primaryHolding?.designationId ?? "",
    designation: def?.name ?? "",
    designationAssignableRoles: def?.assignableRoles ?? [],
    designationStartsOn: primaryRow?.startsOn || todayISO(),
    designationEndsOn: primaryRow?.endsOn ? primaryRow.endsOn : null,
    department: dept,
    departmentId: primaryRow?.departmentId ?? "",
  };
}

export function createEmptyDesignationRow(
  defaults?: Partial<Pick<FacultyDesignationDraftRow, "startsOn" | "department" | "departmentId">>,
): FacultyDesignationDraftRow {
  return {
    key: newRowKey(),
    department: defaults?.department ?? "",
    departmentId: defaults?.departmentId ?? "",
    designationId: "",
    status: "active",
    startsOn: defaults?.startsOn ?? todayISO(),
    endsOn: "",
  };
}
