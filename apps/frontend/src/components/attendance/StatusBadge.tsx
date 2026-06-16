import React from "react";
import { STATUS_MAP } from '@/lib/data/attendanceData';

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
export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  // Ensure we safely access STATUS_MAP, falling back if not found
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP];
  
  if (!s) {
    console.warn(`StatusBadge: Invalid status provided - "${status}"`);
    return null;
  }
  
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
