import React from "react";
import { useAttendanceConfig } from "@/tenant/features/attendance/hooks/useAttendanceConfig";
import { getAttendanceStatusInfo } from "@/lib/data/attendanceData";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge as GlobalStatusBadge } from "@/components/ui/StatusBadge";
import type { AppTranslationKey } from "@mms/shared";

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
  const { t } = useTranslation();
  const statusInfo = getAttendanceStatusInfo(status, statuses);
  
  if (!statusInfo) {
    console.warn(`StatusBadge: Invalid status provided - "${status}"`);
    return null;
  }
  
  const key = `attendance.status.${statusInfo.id}` as AppTranslationKey;
  const translated = t(key);
  const label = translated && translated !== key ? translated : statusInfo.label;
  
  const config = {
    [status]: {
      label,
      cls: `${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} font-semibold`,
      dot: statusInfo.dot,
    }
  };
  
  return (
    <GlobalStatusBadge
      status={status}
      config={config}
      size={size}
    />
  );
}
