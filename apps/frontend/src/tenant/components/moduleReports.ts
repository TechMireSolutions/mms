/**
 * Cross-module public surface for shared Reports tier shells.
 * Feature modules must import from here — not `@/tenant/features/reports/*`.
 */
export { default as KPISummary } from "@/components/ui/reports/KPISummary";
export { default as ModuleReports } from "@/components/ui/reports/ModuleReports";
export { ReportChartCard } from "@/components/ui/reports/ReportChartCard";
export { ReportDataGridContainer } from "@/components/ui/reports/ReportDataGridContainer";
