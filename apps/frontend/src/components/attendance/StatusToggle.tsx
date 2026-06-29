import React from "react";
import { useAttendanceConfig } from "@/hooks/useAttendanceConfig";
import type { AttendanceStatus } from "@/lib/data/attendanceData";
import { Button } from "../ui/button";

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
export function StatusToggle({ value, onChange }: StatusToggleProps) {
  const { statuses } = useAttendanceConfig();
  
  return (
    <div 
      role="group" 
      aria-label="Attendance Status Toggle" 
      className="flex rounded-lg border border-border overflow-hidden text-[11px] font-bold"
    >
      {statuses.map((status: AttendanceStatus) => (
        <Button
          key={status.id}
          type="button"
          onClick={() => onChange(status.id)}
          title={status.label}
          aria-pressed={value === status.id}
          variant="ghost"
          className={`px-2.5 py-1.5 transition-colors rounded-none h-auto ${
            value === status.id
              ? `${status.bg} ${status.text} hover:${status.bg} hover:${status.text}`
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {status.short}
        </Button>
      ))}
    </div>
  );
}
