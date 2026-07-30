import React, { useMemo, useState } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { useHasanatDistributionsCollection, useHasanatDenomsCollection } from "@/tenant/hooks/collections/hasanat";
import { useTranslation } from "@/hooks/useTranslation";
import { getDenominationPoints } from "@mms/shared";
import {
  HasanatDashboardWidgets,
  HasanatDistributionTable,
  HasanatFacultyFilterBanner,
  HasanatReportCharts,
  HasanatReportKpis,
  type HasanatFacultyBarItem,
  type HasanatPieItem,
} from "./HasanatReportSections";

/** Active filter state passed down from the parent report view. */
interface HasanatReportFilters {
  /** Class name to filter by, or "all" for no filter. */
  class: string;
  /** Substring to match against student names (case-insensitive). */
  student: string;
}

/** Props for the HasanatReport component. */
interface HasanatReportProps {
  /** Active report filters. */
  filters: HasanatReportFilters;
  /** Optional callback to open the visualizer with an existing config. */
  onEditVisual?: (config: unknown) => void;
}

export interface HasanatReportItem {
  studentName: string;
  class: string;
  faculty: string;
  distributed: number;
  redeemed: number;
  balance: number;
}

export interface HasanatByFacultyItem {
  faculty: string;
  totalDistributed: number;
  totalRedeemed: number;
}

/**
 * Renders Hasanat reward-point reports including summary KPIs, a faculty
 * distribution bar chart, a redeemed-vs-balance donut, and a filterable table.
 *
 * @param props - The component props.
 * @returns The HasanatReport component.
 */
export default function HasanatReport({ filters }: HasanatReportProps): React.JSX.Element {
  const { t } = useTranslation();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const palette = useBrandPalette();
  const PIE_COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[2]],
    [palette],
  );
  const distributions = useHasanatDistributionsCollection();
  const denominations = useHasanatDenomsCollection();

  const { distributionData, hasanatByFaculty } = useMemo(() => {
    const studentMap: Record<string, HasanatReportItem> = {};
    const facultyMap: Record<string, HasanatByFacultyItem> = {};

    distributions.forEach((distributionRecord) => {
      // Resolve points from the database denominations collection
      const points = getDenominationPoints(distributionRecord.denominationId, distributionRecord.denominationName, denominations);

      const totalPoints = points * distributionRecord.quantity;
      const isRedeemed = distributionRecord.status === "redeemed";

      if (distributionRecord.recipientType === "student") {
        const studentKey = distributionRecord.recipientStudentId || distributionRecord.recipientName || "";
        if (studentKey) {
          const studentName = distributionRecord.recipientName || studentKey;
          if (!studentMap[studentKey]) {
            studentMap[studentKey] = {
              studentName,
              class: distributionRecord.recipientClass,
              faculty: distributionRecord.issuedBy || "—",
              distributed: 0,
              redeemed: 0,
              balance: 0
            };
          }
          studentMap[studentKey].distributed += totalPoints;
          if (isRedeemed) studentMap[studentKey].redeemed += totalPoints;
          else studentMap[studentKey].balance += totalPoints;
        }
      }

      const facultyKey = distributionRecord.issuedBy || "—";
      if (!facultyMap[facultyKey]) {
        facultyMap[facultyKey] = {
          faculty: facultyKey,
          totalDistributed: 0,
          totalRedeemed: 0
        };
      }
      facultyMap[facultyKey].totalDistributed += totalPoints;
      if (isRedeemed) facultyMap[facultyKey].totalRedeemed += totalPoints;
    });

    return {
      distributionData: Object.values(studentMap),
      hasanatByFaculty: Object.values(facultyMap)
    };
  }, [distributions, denominations]);

  const distribution = useMemo<HasanatReportItem[]>(() => {
    let filteredDistribution = distributionData;
    if (filters.class !== "all") {
      filteredDistribution = filteredDistribution.filter((hasanatItem) => hasanatItem.class === filters.class);
    }
    if (filters.student) {
      filteredDistribution = filteredDistribution.filter((hasanatItem) =>
        hasanatItem.studentName.toLowerCase().includes(filters.student.toLowerCase()),
      );
    }
    if (selectedFaculty) {
      filteredDistribution = filteredDistribution.filter((hasanatItem) => hasanatItem.faculty === selectedFaculty);
    }
    return filteredDistribution;
  }, [filters, distributionData, selectedFaculty]);

  const totalDistributed = distribution.reduce((total, hasanatItem) => total + hasanatItem.distributed, 0);
  const totalRedeemed    = distribution.reduce((total, hasanatItem) => total + hasanatItem.redeemed, 0);
  const totalBalance     = distribution.reduce((total, hasanatItem) => total + hasanatItem.balance, 0);
  const redemptionRate   = totalDistributed
    ? ((totalRedeemed / totalDistributed) * 100).toFixed(1)
    : 0;

  const facultyChartData = useMemo<HasanatFacultyBarItem[]>(() => {
    return hasanatByFaculty.map((facultyTotals) => ({
      faculty:     facultyTotals.faculty,
      distributed: facultyTotals.totalDistributed,
      redeemed:    facultyTotals.totalRedeemed,
    }));
  }, [hasanatByFaculty]);
  const toggleFacultyFilter = (faculty: string) => {
    setSelectedFaculty((current) => (current === faculty ? null : faculty));
  };

  const redemptionPieData: HasanatPieItem[] = [
    { name: t("hasanat.report.redeemedPieLabel"), value: totalRedeemed },
    { name: t("hasanat.report.balancePieLabel"),  value: totalBalance  },
  ];

  return (
    <div className="space-y-4">
      <HasanatReportKpis
        totalDistributed={totalDistributed}
        totalRedeemed={totalRedeemed}
        totalBalance={totalBalance}
        redemptionRate={redemptionRate}
      />
      <HasanatReportCharts
        facultyChartData={facultyChartData}
        redemptionPieData={redemptionPieData}
        pieColors={PIE_COLORS}
        onToggleFacultyFilter={toggleFacultyFilter}
      />
      <HasanatFacultyFilterBanner selectedFaculty={selectedFaculty} onClear={() => setSelectedFaculty(null)} />
      <HasanatDistributionTable
        distribution={distribution}
        selectedFaculty={selectedFaculty}
        onToggleFacultyFilter={toggleFacultyFilter}
      />
      <HasanatDashboardWidgets />
    </div>
  );
}
