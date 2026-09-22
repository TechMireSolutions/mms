import React, { useDeferredValue, useMemo, useState } from "react";
import { SearchSelectPicker } from "@/components/ui/SearchSelectPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useFacultyContractList } from "@/tenant/hooks/collections/faculty";

export function SpecializedEntryStaffPicker({
  staffId,
  onPick,
}: {
  staffId: string;
  onPick: (staffId: string, staffName: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const list = useFacultyContractList({ page: 1, limit: 100, search: deferredSearch || undefined }, true);

  const staff = useMemo(() => {
    const body = list.data?.status === 200 ? list.data.body : undefined;
    if (!body || typeof body !== "object") {
      return [];
    }
    const rawList = ("faculty" in body && Array.isArray(body.faculty))
      ? body.faculty
      : ("teachers" in body && Array.isArray(body.teachers))
      ? body.teachers
      : [];
    return rawList
      .map((member: { id?: string; name?: string; employeeId?: string }) => ({
        id: String(member.id ?? ""),
        label: member.employeeId
          ? `${member.name ?? member.id} (${member.employeeId})`
          : String(member.name ?? member.id ?? ""),
      }))
      .filter((member: { id: string }) => member.id);
  }, [list.data]);

  return (
    <SearchSelectPicker
      id="specialized-entry-staff"
      label={t("accounting.journal.specializedEntry.salary.staff")}
      searchPlaceholder={t("accounting.journal.specializedEntry.salary.staffSearch")}
      emptyOptionLabel={t("common.none")}
      value={staffId}
      search={search}
      options={staff}
      onSearchChange={setSearch}
      onPick={onPick}
    />
  );
}
