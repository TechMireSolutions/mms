import React from "react";

interface AttendanceSettingRowProps {
  label: string;
  sub?: string;
  children: React.ReactNode;
}

export function AttendanceSettingRow({ label, sub, children }: AttendanceSettingRowProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border py-3 last:border-0 sm:gap-4">
      <div className="min-w-0 flex-1 basis-[12rem]">
        <p className="m-0 text-sm font-semibold text-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="ms-auto shrink-0">{children}</div>
    </div>
  );
}
