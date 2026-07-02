import React from "react";
import { useAttendanceConfig } from "@/tenant/features/attendance/hooks/useAttendanceConfig";
import { getAttendanceStatusInfo } from "@/lib/data/attendanceData";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

/**
 * StatusBadge
 * 
 * Displays a styled badge representing a specific attendance status.
 * 
 * @param {StatusBadgeProps} props - The component props.
 * @returns {React.ReactElement | null} The rendered badge or null if status is invalid.
 */
export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const { statuses } = useAttendanceConfig();
  const statusInfo = getAttendanceStatusInfo(status, statuses);
  
  if (!statusInfo) {
    console.warn(`StatusBadge: Invalid status provided - "${status}"`);
    return null;
  }
  
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
      {statusInfo.label}
    </span>
  );
}
