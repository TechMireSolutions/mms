import type { AppTranslationKey } from "@mms/shared";

export function translateComparisonMetricName(
  name: string,
  t: (key: AppTranslationKey) => string,
): string {
  switch (name) {
    case "Total Volume": return t("reports.comparison.metricTotalVolume");
    case "Conversion%": return t("reports.comparison.metricConversionPct");
    case "Engagement": return t("reports.comparison.metricEngagement");
    case "Active Status": return t("reports.comparison.metricActiveStatus");
    case "Enrollment": return t("reports.comparison.metricEnrollment");
    case "Attendance%": return t("reports.comparison.metricAttendance");
    case "Fee Collected": return t("reports.comparison.metricFeeCollected");
    case "Pass Rate%": return t("reports.comparison.metricPassRate");
    case "Hasanat": return t("reports.comparison.metricHasanat");
    default: return name;
  }
}
