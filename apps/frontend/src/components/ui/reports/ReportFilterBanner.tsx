import React, { useMemo } from "react";
import { ActiveFilterBanner, type ActiveFilterBannerChip, type ActiveFilterBannerAction } from "@/components/ui/ActiveFilterBanner";

export interface ReportFilterItem {
  key: string;
  label?: string;
  value: string | null | undefined;
  onClear?: () => void;
  clearLabel?: string;
}

export interface ReportFilterBannerProps {
  label?: string;
  filters?: readonly (ReportFilterItem | null | undefined)[];
  onClearAll?: () => void;
  clearAllLabel?: string;
  className?: string;
}

/**
 * Universal active-filter banner for module reporting tabs.
 * Renders active filter chips and individual or bulk clear buttons.
 */
export const ReportFilterBanner = React.memo(function ReportFilterBanner({
  label,
  filters = [],
  onClearAll,
  clearAllLabel,
}: ReportFilterBannerProps): React.JSX.Element | null {
  const activeFilters = useMemo(
    () => filters.filter((item): item is ReportFilterItem => Boolean(item && item.value && item.value.trim() !== "")),
    [filters],
  );

  const chips = useMemo<ActiveFilterBannerChip[]>(
    () =>
      activeFilters.map((item) => ({
        key: item.key,
        label: item.label,
        value: item.value as string,
      })),
    [activeFilters],
  );

  const actions = useMemo<ActiveFilterBannerAction[]>(() => {
    if (onClearAll && clearAllLabel && activeFilters.length > 1) {
      return [{ key: "clear-all", label: clearAllLabel, onClick: onClearAll }];
    }
    return activeFilters
      .filter((item) => typeof item.onClear === "function")
      .map((item) => ({
        key: item.key,
        label: item.clearLabel || `Clear ${item.label || item.key}`,
        onClick: item.onClear as () => void,
      }));
  }, [activeFilters, onClearAll, clearAllLabel]);

  if (chips.length === 0) {
    return null;
  }

  return <ActiveFilterBanner label={label} chips={chips} actions={actions} />;
});

export default ReportFilterBanner;
