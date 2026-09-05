import React, { useDeferredValue, useMemo, useState } from "react";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { useStudentsContractList } from "@/tenant/hooks/collections/students";

export function InvoiceFormStudentPicker({
  t,
  studentId,
  onPick,
}: {
  t: TranslationFunction;
  studentId: string;
  onPick: (studentId: string, studentName: string) => void;
}): React.JSX.Element {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const list = useStudentsContractList(
    { page: 1, limit: 100, search: deferredSearch || undefined },
    true,
  );
  const students = useMemo(() => {
    const body = list.data?.status === 200 ? list.data.body : undefined;
    if (!body || typeof body !== "object" || !("students" in body) || !Array.isArray(body.students)) {
      return [];
    }
    return body.students.map((student: { id?: string; name?: string }) => ({
      id: String(student.id ?? ""),
      name: String(student.name ?? student.id ?? ""),
    })).filter((student: { id: string }) => student.id);
  }, [list.data]);

  if (students.length === 0 && !search) return <></>;

  return (
    <div className="sm:col-span-2 space-y-2">
      <label className={FORM_LABEL} htmlFor="invoice-student-search">
        {t("finance.form.pickStudent")}
      </label>
      <Input
        id="invoice-student-search"
        className={FORM_INPUT}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("finance.form.searchStudent")}
      />
      <FormSelect
        id="invoice-student-pick"
        name="studentPick"
        value={studentId}
        onChange={(value) => {
          const selected = students.find((student: { id: string }) => student.id === value);
          onPick(value, selected?.name ?? "");
        }}
        options={[
          { value: "", label: t("common.none") },
          ...students.map((student: { id: string; name: string }) => ({
            value: student.id,
            label: student.name,
          })),
        ]}
      />
    </div>
  );
}
