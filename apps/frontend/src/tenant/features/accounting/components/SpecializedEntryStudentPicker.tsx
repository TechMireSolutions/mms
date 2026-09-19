import React, { useDeferredValue, useMemo, useState } from "react";
import { SearchSelectPicker } from "@/components/ui/SearchSelectPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudentsContractList } from "@/tenant/hooks/collections/students";

export function SpecializedEntryStudentPicker({
  studentId,
  onPick,
}: {
  studentId: string;
  onPick: (studentId: string, studentName: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const list = useStudentsContractList({ page: 1, limit: 100, search: deferredSearch || undefined }, true);

  const students = useMemo(() => {
    const body = list.data?.status === 200 ? list.data.body : undefined;
    if (!body || typeof body !== "object" || !("students" in body) || !Array.isArray(body.students)) {
      return [];
    }
    return body.students
      .map((student: { id?: string; name?: string }) => ({
        id: String(student.id ?? ""),
        label: String(student.name ?? student.id ?? ""),
      }))
      .filter((student: { id: string }) => student.id);
  }, [list.data]);

  return (
    <SearchSelectPicker
      id="specialized-entry-student"
      label={t("accounting.journal.specializedEntry.fee.student")}
      searchPlaceholder={t("accounting.journal.specializedEntry.fee.studentSearch")}
      emptyOptionLabel={t("common.none")}
      value={studentId}
      search={search}
      options={students}
      onSearchChange={setSearch}
      onPick={onPick}
    />
  );
}
