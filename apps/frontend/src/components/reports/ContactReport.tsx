import React, { useMemo, useCallback, useState } from "react";
import { Users, UserCheck, Target, MessageCircle, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import type { ContactsWorkDrillDown } from "@mms/shared";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { useContactsReportAnalytics } from "@/hooks/useContacts";
import { useTranslation } from "@/hooks/useTranslation";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";
import ContactsSavedReports from "@/components/contacts/ContactsSavedReports";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";

interface ContactReportProps {
  onEditVisual?: (config: unknown) => void;
}

/** CRM analytics for the Contacts module (globle2 §10 — server aggregates). */
export default function ContactReport(props: ContactReportProps = {}) {
  void props.onEditVisual;

  const { t } = useTranslation();
  const { data, isLoading } = useContactsReportAnalytics();
  const analytics = data?.analytics;
  const [lastDrillDown, setLastDrillDown] = useState<ContactsWorkDrillDown>({});
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(() => [primary, charts[3], secondary, charts[4], charts[2], charts[1]], [primary, secondary, charts]);

  const drillToStage = useCallback((stage: string) => {
    const filter = { lifecycleStage: stage };
    setLastDrillDown(filter);
    applyContactsWorkDrillDown(filter);
  }, []);

  const stageDistribution = analytics?.stageDistribution ?? [];
  const stages = analytics?.stageMetrics ?? [];

  const totalContacts = analytics?.total ?? 0;
  const activeContacts = analytics?.activeCount ?? 0;
  const conversionRate = analytics?.conversionRate ?? 0;
  const whatsappRate = analytics?.whatsappRate ?? 0;

  const stageColumn = t("contacts.report.stageColumn");
  const countColumn = t("contacts.report.countColumn");

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ReportSummaryCard icon={Users} label={t("contacts.report.totalContacts")} value={totalContacts} color="primary" />
        <ReportSummaryCard icon={UserCheck} label={t("contacts.report.activeContacts")} value={activeContacts} color="green" />
        <ReportSummaryCard icon={Target} label={t("contacts.report.leadConversion")} value={`${conversionRate}%`} color="violet" />
        <ReportSummaryCard icon={MessageCircle} label={t("contacts.report.whatsappVerified")} value={`${whatsappRate}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">{t("contacts.report.lifecycleDistribution")}</h3>
          <p className="text-xs text-muted-foreground">{t("contacts.report.drillDownHint")}</p>
          <div className="h-[250px] w-full">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="stage"
                  cursor="pointer"
                  onClick={(_, index) => {
                    const item = stageDistribution[index];
                    if (item?.stage) drillToStage(item.stage);
                  }}
                >
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.stage}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">{t("contacts.report.lifecycleConversion")}</h3>
          <div className="h-[250px] w-full">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={stages} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" hide />
                <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip formatter={(v) => (v !== undefined ? `${v}%` : "")} />
                <Bar
                  dataKey="conversionRate"
                  fill={charts[4]}
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  cursor="pointer"
                  onClick={(data) => {
                    const stage = (data as { stage?: string })?.stage;
                    if (stage) drillToStage(stage);
                  }}
                />
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        </div>
      </div>

      <ContactsSavedReports suggestedDrillDown={lastDrillDown} />

      <div className="space-y-4">
        <ReportExportBar
          title={t("contacts.report.stageDistributionExport")}
          data={stageDistribution}
          headers={[stageColumn, countColumn]}
        />
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {[stageColumn, countColumn].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-transparent">
              {stageDistribution.map((p) => (
                <tr key={p.stage} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => drillToStage(p.stage)}>
                  <td className="px-4 py-4 font-bold text-foreground">{p.stage}</td>
                  <td className="px-4 py-4 text-muted-foreground font-medium">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
