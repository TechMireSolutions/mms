import React from "react";
import { ATTENDANCE_STATUSES } from '@/lib/data/attendanceData';

interface StatusToggleProps {
  value: string;
  onChange: (status: string) => void;
}

/**
 * StatusToggle
 * 
 * Provides a button group to toggle between different attendance statuses.
 * 
 * @param {StatusToggleProps} props - The component props.
 * @returns {React.ReactElement} The rendered toggle component.
 */
export default function StatusToggle({ value, onChange }: StatusToggleProps) {
  return (
    <div 
      role="group" 
      aria-label="Attendance Status Toggle" 
      className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold"
    >
      {ATTENDANCE_STATUSES.map((s: { id: string; label: string; bg: string; text: string; short: string }) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          title={s.label}
          aria-pressed={value === s.id}
          className={`px-2.5 py-1.5 transition-colors ${
            value === s.id
              ? `${s.bg} ${s.text}`
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {s.short}
        </button>
      ))}
    </div>
  );
}
