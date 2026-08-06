import { useMemo } from "react";
import type { Student } from "@mms/shared";
import { getDirectoryPageSelection } from "@/lib/directorySelection";

/** Builds page-bound selection flags for Students table/cards (Contacts-shaped). */
export function useStudentsPageDirectoryProps({
  workStudents,
  selectedIds,
}: {
  workStudents: Student[];
  selectedIds: string[];
}) {
  const pageIds = useMemo(
    () => workStudents.map((student) => String(student.id)),
    [workStudents],
  );

  const pageSelection = useMemo(
    () => getDirectoryPageSelection(pageIds, selectedIds),
    [pageIds, selectedIds],
  );

  return {
    pageIds,
    allSelected: pageSelection.allSelected,
    someSelected: pageSelection.someSelected,
  };
}
