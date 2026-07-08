import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  LayoutDashboard, Pin, X, PinOff, Trash2,
  SlidersHorizontal, Info, Pencil, ArrowUpRight, ShieldAlert, ArrowRight, Search, EyeOff, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney, type AppTranslationKey } from "@mms/shared";
const CustomWidgetChartFallback = React.lazy(() => import("@/tenant/features/reports/components/pinnedWidgets/CustomWidgetChartFallback"));
import { getCollection, saveCollection, getObject, saveObject } from "@/lib/db";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { resolveThresholdChartHex, resolveWidgetChartHex } from "@/lib/brandingChartPalette";
import { Session, Class } from '@/lib/data/sessionsData';
import { METADATA_FIELDS, COLLECTION_OPTIONS, computeCustomCard, CustomCard } from "@/tenant/features/reports/components/reportMetadata";
const SessionsTable = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/SessionsTable"));
const OutstandingFeesTable = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/OutstandingFeesTable"));
const FeeCollectionSummary = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/FeeCollectionSummary"));
const OverdueObligationsWidget = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/OverdueObligationsWidget"));
const TodayAttendanceWidget = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/TodayAttendanceWidget"));
const EnrollmentChart = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/charts/EnrollmentChart"));
const RevenueChart = React.lazy(() => import("@/tenant/features/dashboard/components/widgets/charts/RevenueChart"));
const AttendanceChart = React.lazy(() =>
  import("@/tenant/features/dashboard/components/widgets/charts/AttendanceChart").then((m) => ({
    default: m.AttendanceChart,
  }))
);
const HasanatChart = React.lazy(() =>
  import("@/tenant/features/dashboard/components/widgets/charts/AttendanceChart").then((m) => ({
    default: m.HasanatChart,
  }))
);
import {
  CustomWidget,
  ALERT_COLOR_MAP,
  COLOR_MAP,
  ICONS_LIST,
} from "@/tenant/features/reports/components/pinnedWidgets/types";
import { FORM_INPUT_BUILDER, FORM_LABEL } from "@/components/ui/formStyles";
import {
  getWidgetCollections,
  getFilteredRecords,
  computeWidgetSingleValue,
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
import { useContactsWidgetAggregates } from "@/tenant/features/contacts/hooks/useContacts";
import { useStudentsWidgetAggregates } from "@/tenant/features/students/hooks/useStudents";
import { useTeachersWidgetAggregates } from "@/tenant/features/teachers/hooks/useTeachers";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";
import {
  getOrInitializeCustomWidgets,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDefaults";

export type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
export {
  getWidgetCollections,
  getFilteredRecords,
  computeWidgetSingleValue,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";
export { getOrInitializeCustomWidgets } from "@/tenant/features/reports/components/pinnedWidgets/widgetDefaults";



interface WidgetRecordFields {
  id?: string;
  name?: string;
  studentName?: string;
  invoiceNo?: string;
  age?: number | string;
  gender?: string;
  studentId?: string;
  finalAmt?: number;
  date?: string;
  className?: string;
  quantity?: number;
  denominationName?: string;
  points?: number;
  isActive?: boolean;
  email?: string;
  room?: string;
  type?: string;
  status?: string;
  lifecycleStage?: string;
}

/**
 * Focused overlay drilldown modal for micro-interactions.
 * Displays details of records matching the single metric.
 */
function WidgetDrilldownModal({
  widget,
  onClose
}: {
  widget: CustomWidget;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [collections, setCollections] = useState(() => getWidgetCollections());

  useEffect(() => {
    const handleUpdate = () => {
      setCollections(getWidgetCollections());
    };
    window.addEventListener("local-database-update", handleUpdate);
    return () => window.removeEventListener("local-database-update", handleUpdate);
  }, []);

  const students = useMemo(() => collections.students, [collections]);
  const studentNameMap = useMemo(() => {
    return new Map((students as unknown as Record<string, unknown>[]).map((student) => [String(student.id), String(student.name || student.studentName || student.id)]));
  }, [students]);

  const filteredRecords = useMemo(() => {
    const widgetRecords = getFilteredRecords(widget, collections);
    if (!search) return widgetRecords;
    const searchText = search.toLowerCase();
    return widgetRecords.filter((widgetRecord) => {
      return Object.values(widgetRecord).some((fieldValue) => String(fieldValue).toLowerCase().includes(searchText));
    });
  }, [widget, collections, search]);

  const handleToggleStatus = (recordId: string) => {
    try {
      const collectionName = widget.collection;
      const storedRecords = getCollection<Record<string, unknown>>(collectionName, []);
      const updatedRecords = storedRecords.map((storedRecord) => {
        if (String(storedRecord.id) === String(recordId)) {
          if (collectionName === "students") {
            const nextStatus = storedRecord.status === "active" ? "inactive" : "active";
            return { ...storedRecord, status: nextStatus };
          } else if (collectionName === "finance_invoices") {
            const nextStatus = storedRecord.status === "paid" ? "unpaid" : "paid";
            const finalAmt = Number(storedRecord.finalAmt || 0);
            return { ...storedRecord, status: nextStatus, paidAmt: nextStatus === "paid" ? finalAmt : 0 };
          } else if (collectionName === "attendance_records") {
            const nextStatus = storedRecord.status === "present" ? "absent" : "present";
            return { ...storedRecord, status: nextStatus };
          } else if (collectionName === "contacts") {
            const nextActive = storedRecord.isActive === false ? true : false;
            return { ...storedRecord, isActive: nextActive };
          } else if (collectionName === "sessions") {
            const nextStatus = storedRecord.status === "active" ? "inactive" : "active";
            return { ...storedRecord, status: nextStatus };
          }
        }
        return storedRecord;
      });
      saveCollection(collectionName, updatedRecords);
      window.dispatchEvent(new Event("local-database-update"));
    } catch (error) {
      console.error("Failed to toggle record status", error);
    }
  };

  const handleDeleteDist = (distId: string) => {
    try {
      const distributions = getCollection<Record<string, unknown>>("hasanat_distributions", []);
      const updatedDistributions = distributions.filter((distribution) => String(distribution.id) !== String(distId));
      saveCollection("hasanat_distributions", updatedDistributions);
      window.dispatchEvent(new Event("local-database-update"));
    } catch (error) {
      console.error("Failed to delete distribution", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-primary uppercase font-black tracking-widest block">{t("reports.widgets.drilldownTitle")}</span>
            <h3 className="text-base font-black text-foreground">{t("reports.widgets.records", { title: widget.title })}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Search Bar */}
        <div className="p-4 border-b border-border bg-card flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("reports.widgets.searchRecords")}
            className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder-muted-foreground font-semibold"
          />
          <span className="text-[10px] text-muted-foreground font-bold px-2 py-0.5 bg-muted rounded-full border border-border">
            {t("reports.widgets.foundCount", { count: filteredRecords.length })}
          </span>
        </div>

        {/* Modal Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <EyeOff className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs font-bold uppercase tracking-wider">{t("reports.widgets.noRecords")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-black text-[9px] tracking-wider text-left">
                    <th className="pb-3">{t("reports.widgets.refName")}</th>
                    <th className="pb-3">{t("reports.widgets.primaryInfo")}</th>
                    <th className="pb-3">{t("reports.widgets.currentStatus")}</th>
                    <th className="pb-3 text-right">{t("reports.widgets.microAction")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRecords.map((recordSource, index) => {
                    const displayRecord = recordSource as unknown as WidgetRecordFields;
                    const recordId = String(displayRecord.id || index);
                    
                    // Format columns based on collection
                    let name = String(displayRecord.name || displayRecord.studentName || displayRecord.invoiceNo || displayRecord.id);
                    let detailText = "";
                    let status = String(displayRecord.status || displayRecord.lifecycleStage || "active");
                    let hasAction = true;
                    
                    if (widget.collection === "students") {
                      name = String(displayRecord.name || "");
                      detailText = t("reports.widgets.ageText", {
                        age: String(displayRecord.age || "N/A"),
                        gender: displayRecord.gender ? t(`reports.fields.${displayRecord.gender}` as AppTranslationKey) || displayRecord.gender : t("reports.widgets.any")
                      });
                    } else if (widget.collection === "finance_invoices") {
                      name = t("reports.widgets.invoiceText", { invoiceNo: displayRecord.invoiceNo || String(displayRecord.id || "") });
                      const studentId = String(displayRecord.studentId || "");
                      const studentName = studentNameMap.get(studentId) || t("reports.widgets.studentHash", { id: studentId });
                      detailText = `${studentName} • ${formatMoney(displayRecord.finalAmt || 0)}`;
                    } else if (widget.collection === "attendance_records") {
                      const studentId = String(displayRecord.studentId || "");
                      name = studentNameMap.get(studentId) || t("reports.widgets.studentHash", { id: studentId });
                      detailText = t("reports.widgets.classText", { date: displayRecord.date || "", className: displayRecord.className || t("reports.widgets.class") });
                    } else if (widget.collection === "hasanat_distributions") {
                      const studentId = String(displayRecord.studentId || "");
                      name = studentNameMap.get(studentId) || t("reports.widgets.studentHash", { id: studentId });
                      detailText = t("reports.widgets.qtyText", { denomination: displayRecord.denominationName || "Standard", qty: displayRecord.quantity || 1 });
                      status = t("reports.widgets.pointsText", { points: displayRecord.points || 50 });
                      hasAction = false; // deleting is the action instead of toggling status
                    } else if (widget.collection === "contacts") {
                      detailText = `${displayRecord.email || t("reports.widgets.noEmail")} • ${displayRecord.gender || "male"}`;
                      status = displayRecord.isActive !== false ? "active" : "inactive";
                    } else if (widget.collection === "sessions") {
                      name = String(displayRecord.name || "");
                      detailText = t("reports.widgets.roomText", { type: displayRecord.type || "Hifz", room: displayRecord.room || "N/A" });
                    }

                    return (
                      <tr key={recordId} className="hover:bg-muted/10">
                        <td className="py-3.5 pr-2 font-bold text-foreground max-w-[180px] truncate">{name}</td>
                        <td className="py-3.5 text-muted-foreground font-semibold">{detailText}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            ["active", "paid", "present", "customer"].includes(status.toLowerCase())
                              ? "bg-success/10 text-success border-success/20"
                              : ["inactive", "unpaid", "absent", "lead", "cancelled"].includes(status.toLowerCase())
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}>
                            {t(`reports.status.${status.toLowerCase()}` as AppTranslationKey) || status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {widget.collection === "hasanat_distributions" ? (
                            <button
                              onClick={() => handleDeleteDist(recordId)}
                              className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer font-bold uppercase tracking-wider text-[9px]"
                              type="button"
                            >
                              {t("reports.widgets.delete")}
                            </button>
                          ) : hasAction ? (
                            <button
                              onClick={() => handleToggleStatus(recordId)}
                              className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer font-bold uppercase tracking-wider text-[9px]"
                              type="button"
                            >
                              {t("reports.widgets.toggleStatus")}
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Standard or Compact Progress Circle Ring Component.
 */
function ProgressRing({
  percentage,
  colorHex,
  isCompact
}: {
  percentage: number;
  colorHex: string;
  isCompact?: boolean;
}): React.JSX.Element {
  const size = isCompact ? 40 : 64;
  const strokeWidth = isCompact ? 4 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-muted-foreground/10 fill-none"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-none transition-all duration-500 ease-out"
          stroke={colorHex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute font-black tracking-tight text-foreground ${isCompact ? "text-[8px]" : "text-xs font-mono"}`}>
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Render interface resolving dynamic card visualizations.
 */
function CustomWidgetRenderer({
  widget,
  collections,
  isCompact,
  isEditMode = false,
  onSwitchToggle,
  onMetricClick
}: {
  widget: CustomWidget;
  collections: ReturnType<typeof getWidgetCollections>;
  isCompact?: boolean;
  isEditMode?: boolean;
  onSwitchToggle: (widget: CustomWidget) => void;
  onMetricClick: (widget: CustomWidget) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const palette = useBrandPalette();
  
  const resolvedWidgetType = widget.widgetType || (["bar", "line", "area", "pie", "radar"].includes(widget.chartType || "") ? "chart" : "kpi");

  const { value, formattedValue, isAlert } = useMemo(() => {
    if (resolvedWidgetType === "card") {
      return { value: 0, formattedValue: "", isAlert: false };
    }
    return computeWidgetSingleValue(widget, collections);
  }, [resolvedWidgetType, widget, collections]);

  const isSwitchOn = useMemo(() => {
    if (resolvedWidgetType === "card") return false;
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        return !!settings[sectionKey];
      }
      return getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
    }
    const collectionName = widget.switchCollection;
    const recordId = widget.switchRecordId;
    const targetField = widget.switchField || "status";
    if (!collectionName || !recordId) return false;
    const collectionRecords = collections[collectionName] || [];
    const matchedRecord = collectionRecords.find((candidate: { id?: unknown }) => String(candidate.id) === String(recordId));
    if (!matchedRecord) return false;
    const fieldValue = (matchedRecord as Record<string, unknown>)[targetField];
    return String(fieldValue) === "active" || String(fieldValue) === "paid" || !!fieldValue;
  }, [resolvedWidgetType, widget, collections]);

  if (resolvedWidgetType === "card") {
    const card = widget as unknown as CustomCard;
    let computed = null as ReturnType<typeof computeCustomCard> | null;

    if (card.collection === "contacts") {
      const aggregateValue = computeContactsCustomCardValue({
        id: card.id,
        operation: card.operation,
        targetField: card.targetField,
        filterField: card.filterField,
        filterOperator: card.filterOperator,
        filterValue: card.filterValue,
      });
      if (aggregateValue) {
        computed = {
          id: card.id,
          title: card.title,
          value: String(aggregateValue.finalValue),
          sub: card.fixedSubText || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
          icon: card.icon,
          color: card.color,
          trend: card.trend || 0,
        };
      }
    } else if (card.collection === "students") {
      const aggregateValue = computeStudentsCustomCardValue({
        id: card.id,
        operation: card.operation,
        targetField: card.targetField,
        filterField: card.filterField,
        filterOperator: card.filterOperator,
        filterValue: card.filterValue,
      });
      if (aggregateValue) {
        computed = {
          id: card.id,
          title: card.title,
          value: String(aggregateValue.finalValue),
          sub: card.fixedSubText || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
          icon: card.icon,
          color: card.color,
          trend: card.trend || 0,
        };
      }
    } else if (card.collection === "teachers") {
      const aggregateValue = computeTeachersCustomCardValue({
        id: card.id,
        operation: card.operation,
        targetField: card.targetField,
        filterField: card.filterField,
        filterOperator: card.filterOperator,
        filterValue: card.filterValue,
      });
      if (aggregateValue) {
        computed = {
          id: card.id,
          title: card.title,
          value: String(aggregateValue.finalValue),
          sub: card.fixedSubText || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
          icon: card.icon,
          color: card.color,
          trend: card.trend || 0,
        };
      }
    }

    if (!computed) {
      computed = computeCustomCard(card, {
        ...collections,
        students: [],
        teachers: [],
        contacts: [],
      });
    }

    const Icon = ICONS_LIST[computed.icon || ""] || Users;
    const colorClasses = COLOR_MAP[computed.color || ""] || COLOR_MAP.emerald;
    const isPositive = computed.trend >= 0;
    
    if (isCompact) {
      return (
        <button
          onClick={() => onMetricClick(widget)}
          className={`w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border transition-all cursor-pointer outline-none select-none relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/80 hover:border-muted-foreground/30 hover:bg-card/75`}
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {widget.title}
          </span>
          <span className="text-base font-black tracking-tight font-mono my-auto max-w-full truncate text-foreground">
            {computed.value}
          </span>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {t(`reports.collections.${widget.collection}` as AppTranslationKey)}
          </span>
        </button>
      );
    }
    
    return (
      <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all duration-300 relative text-left flex flex-col justify-between min-h-[140px] font-sans">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-lg ${colorClasses.bg} ring-4 ${colorClasses.ring} flex items-center justify-center aspect-square flex-shrink-0`}>
            <Icon className={`w-4.5 h-4.5 ${colorClasses.text}`} style={{ width: 18, height: 18 }} />
          </div>
          {computed.trend !== 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              isPositive ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {isPositive ? "+" : ""}{computed.trend}%
            </span>
          )}
        </div>
        <div className="space-y-0.5 flex-1 min-w-0 mt-3">
          <p className="text-[20px] font-black text-foreground tracking-tight leading-none truncate">
            {computed.value}
          </p>
          <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mt-1 truncate">
            {computed.title}
          </h4>
        </div>
        <footer className="text-[10px] text-muted-foreground mt-3 border-t border-border/30 pt-2 truncate">
          {computed.sub}
        </footer>
      </div>
    );
  }

  const colorHex = isAlert
    ? resolveThresholdChartHex(widget.thresholdColor, palette)
    : resolveWidgetChartHex(widget.color, palette);

  const alertScheme = isAlert ? ALERT_COLOR_MAP[widget.thresholdColor || "red"] : null;

  // Handle Switch inline toggle
  const handleSwitchClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSwitchToggle(widget);
  };

  // Compact size (100x100px) widget layouts
  if (isCompact) {
    if (["sessions-list", "attendance-summary", "fee-summary", "outstanding-list", "overdue-obligations", "enrollment-trends", "revenue-expenses", "attendance-rate", "hasanat-distribution"].includes(resolvedWidgetType)) {
      const displayAsProgress = resolvedWidgetType === "attendance-summary";
      if (displayAsProgress) {
        return (
          <button
            onClick={() => onMetricClick(widget)}
            className={`w-[100px] h-[100px] p-1.5 text-center flex flex-col justify-between items-center rounded-2xl border transition-all cursor-pointer outline-none select-none relative overflow-hidden ${
              alertScheme 
                ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
                : "bg-card/50 backdrop-blur-sm border-border/80 hover:border-muted-foreground/30 hover:bg-card/75"
            }`}
            type="button"
          >
            <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
              {widget.title}
            </span>
            <div className="my-auto">
              <ProgressRing percentage={value} colorHex={colorHex} isCompact />
            </div>
            <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
              {t(`reports.collections.${widget.collection}` as AppTranslationKey)}
            </span>
          </button>
        );
      } else {
        return (
          <button
            onClick={() => onMetricClick(widget)}
            className={`w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border transition-all cursor-pointer outline-none select-none relative overflow-hidden ${
              alertScheme 
                ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
                : "bg-card/50 backdrop-blur-sm border-border/80 hover:border-muted-foreground/30 hover:bg-card/75"
            }`}
            type="button"
          >
            <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
              {widget.title}
            </span>
            <span className={`text-base font-black tracking-tight font-mono my-auto max-w-full truncate ${alertScheme ? alertScheme.text : "text-foreground"}`}>
              {formattedValue}
            </span>
            <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
              {t(`reports.collections.${widget.collection}` as AppTranslationKey)}
            </span>
          </button>
        );
      }
    }

    if (resolvedWidgetType === "kpi") {
      return (
        <button
          onClick={() => onMetricClick(widget)}
          className={`w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border transition-all cursor-pointer outline-none select-none relative overflow-hidden ${
            alertScheme 
              ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
              : "bg-card/50 backdrop-blur-sm border-border/80 hover:border-muted-foreground/30 hover:bg-card/75"
          }`}
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {widget.title}
          </span>
          <span className={`text-base font-black tracking-tight font-mono my-auto max-w-full truncate ${alertScheme ? alertScheme.text : "text-foreground"}`}>
            {formattedValue}
          </span>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {t(`reports.collections.${widget.collection}` as AppTranslationKey)}
          </span>
        </button>
      );
    }

    if (resolvedWidgetType === "progress") {
      return (
        <button
          onClick={() => onMetricClick(widget)}
          className={`w-[100px] h-[100px] p-1.5 text-center flex flex-col justify-between items-center rounded-2xl border transition-all cursor-pointer outline-none select-none relative overflow-hidden ${
            alertScheme 
              ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
              : "bg-card/50 backdrop-blur-sm border-border/80 hover:border-muted-foreground/30 hover:bg-card/75"
          }`}
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {widget.title}
          </span>
          <div className="my-auto">
            <ProgressRing percentage={value} colorHex={colorHex} isCompact />
          </div>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {t(`reports.collections.${widget.collection}` as AppTranslationKey)}
          </span>
        </button>
      );
    }

    if (resolvedWidgetType === "switch") {
      return (
        <div
          className="w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border bg-card/50 backdrop-blur-sm border-border/80 overflow-hidden relative"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {widget.title}
          </span>
          
          <button
            onClick={handleSwitchClick}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${isSwitchOn ? "bg-primary" : "bg-muted border border-border/60"}`}
            type="button"
          >
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`w-2.5 h-2.5 rounded-full shadow-sm ${isSwitchOn ? "bg-primary-foreground ml-auto" : "bg-muted-foreground"}`}
            />
          </button>

          <span className="text-[7px] font-black uppercase tracking-widest mb-0.5" style={{ color: isSwitchOn ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
            {isSwitchOn ? (widget.switchLabelOn || t("reports.widgets.statusOn")) : (widget.switchLabelOff || t("reports.widgets.statusOff"))}
          </span>
        </div>
      );
    }
  }

  // Comfortable mode (standard card sized) layouts
  if (resolvedWidgetType === "sessions-list") {
    return (
      <React.Suspense fallback={<div className="min-h-[140px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <SessionsTable title={widget.title} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "attendance-summary") {
    return (
      <React.Suspense fallback={<div className="min-h-[140px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <TodayAttendanceWidget title={widget.title} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "fee-summary") {
    return (
      <React.Suspense fallback={<div className="min-h-[140px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <FeeCollectionSummary title={widget.title} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "outstanding-list") {
    return (
      <React.Suspense fallback={<div className="min-h-[140px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <OutstandingFeesTable title={widget.title} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "overdue-obligations") {
    return (
      <React.Suspense fallback={<div className="min-h-[140px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <OverdueObligationsWidget title={widget.title} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "enrollment-trends") {
    return (
      <React.Suspense fallback={<div className="min-h-[300px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <EnrollmentChart isEditMode={isEditMode} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "revenue-expenses") {
    return (
      <React.Suspense fallback={<div className="min-h-[300px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <RevenueChart isEditMode={isEditMode} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "attendance-rate") {
    return (
      <React.Suspense fallback={<div className="min-h-[300px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <AttendanceChart isEditMode={isEditMode} />
      </React.Suspense>
    );
  }
  if (resolvedWidgetType === "hasanat-distribution") {
    return (
      <React.Suspense fallback={<div className="min-h-[300px] bg-muted/20 animate-pulse rounded-3xl" />}>
        <HasanatChart isEditMode={isEditMode} />
      </React.Suspense>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-3xl border p-5 flex flex-col justify-between shadow-sm relative group hover:shadow-md transition-all ${
        alertScheme 
          ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} border-[1.5px]` 
          : "bg-card/50 backdrop-blur-md border-border/60"
      }`}
    >
      {/* Widget Card Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 text-left">
          <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none block">
            {widget.title}
          </span>
          <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
            {t(`reports.collections.${widget.collection}` as AppTranslationKey)} {resolvedWidgetType !== "switch" ? `• ${t(`reports.widgets.builder.formula${widget.operation.charAt(0).toUpperCase() + widget.operation.slice(1)}` as AppTranslationKey) || widget.operation}` : ""}
          </p>
        </div>
        
        {isAlert && (
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 animate-pulse">
            <ShieldAlert className="w-2.5 h-2.5" />
            {t("reports.widgets.alertLevel")}
          </span>
        )}
      </div>

      {/* Widget Card Body */}
      <div className="py-4 flex items-center justify-between min-h-[70px]">
        {resolvedWidgetType === "kpi" && (
          <button
            onClick={() => onMetricClick(widget)}
            className="text-left cursor-pointer select-none outline-none group/kpi"
            type="button"
          >
            <h4 className={`text-3xl font-black tracking-tight font-mono flex items-baseline gap-1.5 ${alertScheme ? alertScheme.text : "text-foreground"}`}>
              {formattedValue}
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/35 group-hover/kpi:text-primary group-hover/kpi:translate-x-0.5 group-hover/kpi:-translate-y-0.5 transition-all" />
            </h4>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              {t("reports.widgets.clickToViewRecords")}
            </p>
          </button>
        )}

        {resolvedWidgetType === "progress" && (
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={() => onMetricClick(widget)}
              className="flex-1 text-left cursor-pointer outline-none group/prog"
              type="button"
            >
              <h4 className="text-sm font-black text-foreground flex items-center gap-1">
                {t("reports.widgets.progression")}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/prog:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                {t("reports.widgets.progressionDesc")}
              </p>
            </button>
            <ProgressRing percentage={value} colorHex={colorHex} />
          </div>
        )}

        {resolvedWidgetType === "switch" && (
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <span className={`text-base font-black uppercase tracking-wider ${isSwitchOn ? "text-primary" : "text-muted-foreground"}`}>
                {isSwitchOn ? (widget.switchLabelOn || t("reports.status.active")) : (widget.switchLabelOff || t("reports.status.locked"))}
              </span>
              <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                {t("reports.widgets.clickToToggle")}
              </p>
            </div>
            
            <button
              onClick={handleSwitchClick}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 relative cursor-pointer ${isSwitchOn ? "bg-primary" : "bg-muted border border-border/80"}`}
              type="button"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-4 h-4 rounded-full shadow-md ${isSwitchOn ? "bg-primary-foreground ml-auto" : "bg-muted-foreground"}`}
              />
            </button>
          </div>
        )}

        {resolvedWidgetType === "chart" && (
          <div className="w-full h-[80px] -mb-2">
            <React.Suspense fallback={<div className="w-full h-full bg-muted/20 animate-pulse rounded-xl" />}>
              <CustomWidgetChartFallback widget={widget} collections={collections} />
            </React.Suspense>
          </div>
        )}
      </div>
    </motion.div>
  );
}


interface DashboardWidgetsProps {
  widgets?: CustomWidget[];
  onUnpin?: (id: string) => void;
  isEditMode?: boolean;
  onEditWidget?: (widget: CustomWidget) => void;
  onDeleteWidget?: (id: string) => void;
}

/**
 * Pinned Custom Dashboard Widgets Section. Displays widgets with size controls.
 */
export function DashboardWidgets({ 
  widgets, 
  onUnpin,
  isEditMode = false,
  onEditWidget,
  onDeleteWidget
}: DashboardWidgetsProps = {}): React.JSX.Element | null {
  const { t } = useTranslation();
  const [localWidgets, setLocalWidgets] = useState<CustomWidget[]>([]);
  const [collections, setCollections] = useState(() => getWidgetCollections());
  
  const [gridMode, setGridMode] = useState<"comfortable" | "compact">(() => {
    return (localStorage.getItem("pinned_widgets_grid_mode") as "comfortable" | "compact") || "comfortable";
  });

  const [drilldownWidget, setDrilldownWidget] = useState<CustomWidget | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setCollections(getWidgetCollections());
      if (widgets) return;
      try {
        const savedWidgets = getObject<CustomWidget[] | null>("kpi_custom_widgets", null);
        if (savedWidgets) {
          setLocalWidgets(savedWidgets.filter((widget) => widget.isPinnedToDashboard));
        }
      } catch (error) {
        console.error("Failed to load pinned widgets on dashboard", error);
      }
    };

    handleUpdate();
    window.addEventListener("local-database-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("local-database-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [widgets]);

  const activeWidgets = widgets ?? localWidgets;
  useContactsWidgetAggregates(activeWidgets);
  useStudentsWidgetAggregates(activeWidgets);
  useTeachersWidgetAggregates(activeWidgets);

  const handleMetricClick = useCallback((widget: CustomWidget) => {
    if (widget.collection === "contacts") {
      applyContactsWorkDrillDown({
        gender: widget.filterField === "gender" && widget.filterValue ? widget.filterValue : undefined,
      });
      window.location.assign("/contacts");
      return;
    }
    setDrilldownWidget(widget);
  }, []);

  const handleLocalUnpin = (id: string) => {
    if (onUnpin) {
      onUnpin(id);
      return;
    }
    try {
      const savedWidgets = getObject<CustomWidget[] | null>("kpi_custom_widgets", null);
      if (savedWidgets) {
        const updatedWidgets = savedWidgets.map((widget) => {
          if (widget.id === id) {
            return { ...widget, isPinnedToDashboard: false };
          }
          return widget;
        });
        saveObject("kpi_custom_widgets", updatedWidgets);
        setLocalWidgets(updatedWidgets.filter((widget) => widget.isPinnedToDashboard));
        window.dispatchEvent(new Event("local-database-update"));
      }
    } catch (error) {
      console.error("Failed to unpin widget", error);
    }
  };

  const handleToggleSwitchState = (widget: CustomWidget) => {
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        settings[sectionKey] = !settings[sectionKey];
        saveObject("dashboard_section_settings", settings);
      } else {
        const isEnabled = getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
        saveObject(switchStateKey, !isEnabled);
      }
    } else {
      const collectionName = widget.switchCollection;
      const recordId = widget.switchRecordId;
      const targetField = widget.switchField || "status";
      if (!collectionName || !recordId) return;
      try {
        const storedRecords = getCollection<Record<string, unknown>>(collectionName, []);
        const updatedRecords = storedRecords.map((storedRecord) => {
          if (String(storedRecord.id) === String(recordId)) {
            const currentFieldValue = storedRecord[targetField];
            let nextValue: unknown = !currentFieldValue;
            if (currentFieldValue === "active") nextValue = "inactive";
            else if (currentFieldValue === "inactive") nextValue = "active";
            else if (currentFieldValue === "paid") nextValue = "unpaid";
            else if (currentFieldValue === "unpaid") nextValue = "paid";
            
            return { ...storedRecord, [targetField]: nextValue };
          }
          return storedRecord;
        });
        saveCollection(collectionName, updatedRecords);
      } catch (error) {
        console.error(error);
      }
    }
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleToggleGridMode = (mode: "comfortable" | "compact") => {
    setGridMode(mode);
    localStorage.setItem("pinned_widgets_grid_mode", mode);
  };

  if (activeWidgets.length === 0) return null;

  return (
    <div className="space-y-4 text-left font-sans mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.widgets.pinnedPanels")}</h3>
        </div>
        
        {/* Layout Density Controls */}
        <div className="flex items-center gap-1 border border-border/80 bg-muted/30 p-1 rounded-xl">
          <button
            onClick={() => handleToggleGridMode("comfortable")}
            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
              gridMode === "comfortable" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            {t("reports.widgets.comfortable")}
          </button>
          <button
            onClick={() => handleToggleGridMode("compact")}
            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
              gridMode === "compact" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
            type="button"
          >
            {t("reports.widgets.compact")}
          </button>
        </div>
      </div>

      <div className={
        gridMode === "compact"
          ? "flex flex-wrap gap-2.5 pt-1"
          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1"
      }>
        {activeWidgets.map((widget) => {
          let colSpanClass = "";
          if (gridMode !== "compact") {
            if (widget.widgetType === "overdue-obligations") {
              colSpanClass = "col-span-full";
            } else if (
              [
                "sessions-list",
                "attendance-summary",
                "fee-summary",
                "outstanding-list",
                "enrollment-trends",
                "revenue-expenses",
                "attendance-rate",
                "hasanat-distribution"
              ].includes(widget.widgetType || "")
            ) {
              colSpanClass = "lg:col-span-2 md:col-span-3 col-span-1";
            }
          }
          return (
            <div key={widget.id} className={`relative group ${colSpanClass}`}>
              <CustomWidgetRenderer
                widget={widget}
                collections={collections}
                isCompact={gridMode === "compact"}
                isEditMode={isEditMode}
                onSwitchToggle={handleToggleSwitchState}
                onMetricClick={handleMetricClick}
              />
              
              {/* Overlaid unpin/edit/delete action handles */}
              <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 z-10 transition-all ${
                gridMode === "compact" ? "scale-75 top-0.5 right-0.5" : ""
              }`}>
                {isEditMode && onEditWidget && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditWidget(widget);
                    }}
                    className="p-1.5 rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all cursor-pointer"
                    title={t("reports.widgets.editWidget")}
                    type="button"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                {isEditMode && onDeleteWidget && !widget.id.startsWith("def-") && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteWidget(widget.id);
                    }}
                    className="p-1.5 rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all cursor-pointer"
                    title={t("reports.widgets.deleteWidget")}
                    type="button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleLocalUnpin(widget.id)}
                  className="p-1.5 rounded bg-card/85 backdrop-blur border border-border/60 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                  title={t("reports.widgets.unpinWidget")}
                  type="button"
                >
                  <PinOff className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drilldown modal rendering */}
      <AnimatePresence>
        {drilldownWidget && (
          <WidgetDrilldownModal
            widget={drilldownWidget}
            onClose={() => setDrilldownWidget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * PinnedWidgets Main Module Component. Exposes custom Widget builders.
 */
export default function PinnedWidgets({ category }: { category: string }): React.JSX.Element {
  const { t } = useTranslation();
  const [widgets, setWidgets] = useState<CustomWidget[]>(() => {
    return getOrInitializeCustomWidgets();
  });

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [collections, setCollections] = useState(() => getWidgetCollections());

  useEffect(() => {
    const handleUpdate = () => {
      setCollections(getWidgetCollections());
    };
    window.addEventListener("local-database-update", handleUpdate);
    return () => window.removeEventListener("local-database-update", handleUpdate);
  }, []);

  const [sectionSettings, setSectionSettings] = useState<Record<string, boolean>>(() => {
    return getObject<Record<string, boolean>>("dashboard_section_settings", {
      enrollmentChart: true,
      revenueChart: true,
      attendanceChart: true,
      hasanatChart: true,
      sessionsTable: true,
      todayAttendance: true,
      feeSummary: true,
      outstandingFees: true,
      overdueObligations: true
    });
  });

  const [disabledCardIds, setDisabledCardIds] = useState<string[]>(() => {
    return getObject<string[]>("mms_dashboard_disabled_cards", []);
  });

  const toggleSectionSetting = (key: string) => {
    const nextSectionSettings = { ...sectionSettings, [key]: !sectionSettings[key] };
    setSectionSettings(nextSectionSettings);
    saveObject("dashboard_section_settings", nextSectionSettings);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const toggleCardVisibility = (cardId: string) => {
    let nextDisabledCardIds: string[];
    if (disabledCardIds.includes(cardId)) {
      nextDisabledCardIds = disabledCardIds.filter(id => id !== cardId);
    } else {
      nextDisabledCardIds = [...disabledCardIds, cardId];
    }
    setDisabledCardIds(nextDisabledCardIds);
    saveObject("mms_dashboard_disabled_cards", nextDisabledCardIds);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const showControls = ["students", "sessions", "attendance", "financial", "accounting", "hasanat"].includes(category);

  const defaultCollection = useMemo<CustomWidget["collection"]>(() => {
    if (category === "students") return "students";
    if (category === "contacts") return "contacts";
    if (category === "attendance") return "attendance_records";
    if (category === "financial" || category === "accounting") return "finance_invoices";
    if (category === "hasanat") return "hasanat_distributions";
    if (category === "sessions") return "sessions";
    return "students";
  }, [category]);

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);



  const handleDeleteWidget = (id: string) => {
    const nextWidgets = widgets.filter((widget) => widget.id !== id);
    setWidgets(nextWidgets);
    saveObject("kpi_custom_widgets", nextWidgets);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleTogglePin = (id: string) => {
    const nextWidgets = widgets.map((widget) => {
      if (widget.id === id) {
        return { ...widget, isPinnedToDashboard: !widget.isPinnedToDashboard };
      }
      return widget;
    });
    setWidgets(nextWidgets);
    saveObject("kpi_custom_widgets", nextWidgets);
    window.dispatchEvent(new Event("local-database-update"));
  };

  const handleEditClick = (widget: CustomWidget) => {
    setEditingWidgetId(widget.id);
    setIsBuilderOpen(true);
  };

  const handleOpenCreateBuilder = () => {
    setEditingWidgetId(null);
    setIsBuilderOpen(true);
  };

  const handleToggleSwitchStateLocal = (widget: CustomWidget) => {
    if (widget.switchActionType === "app_setting") {
      const switchStateKey = widget.switchStateKey || "";
      if (switchStateKey.startsWith("section_")) {
        const sectionKey = switchStateKey.replace("section_", "");
        const settings = getObject<Record<string, boolean>>("dashboard_section_settings", {});
        settings[sectionKey] = !settings[sectionKey];
        saveObject("dashboard_section_settings", settings);
      } else {
        const currentSwitchValue = getObject<unknown>(switchStateKey, false) === true || getObject<unknown>(switchStateKey, "false") === "true";
        saveObject(switchStateKey, !currentSwitchValue);
      }
    } else {
      const collectionName = widget.switchCollection;
      const recordId = widget.switchRecordId;
      const targetField = widget.switchField || "status";
      if (!collectionName || !recordId) return;
      try {
        const storedRecords = getCollection<Record<string, unknown>>(collectionName, []);
        const updatedRecords = storedRecords.map((storedRecord) => {
          if (String(storedRecord.id) === String(recordId)) {
            const currentFieldValue = storedRecord[targetField];
            let nextValue: unknown = !currentFieldValue;
            if (currentFieldValue === "active") nextValue = "inactive";
            else if (currentFieldValue === "inactive") nextValue = "active";
            else if (currentFieldValue === "paid") nextValue = "unpaid";
            else if (currentFieldValue === "unpaid") nextValue = "paid";
            
            return { ...storedRecord, [targetField]: nextValue };
          }
          return storedRecord;
        });
        saveCollection(collectionName, updatedRecords);
      } catch (error) {
        console.error(error);
      }
    }
    window.dispatchEvent(new Event("local-database-update"));
  };

  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => widget.category === category);
  }, [widgets, category]);


  return (
    <div className="space-y-4 font-sans text-left">
      {/* Pinned widgets controls header banner */}
      <div className="flex items-center justify-between bg-card/45 backdrop-blur-xl border border-border/50 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground leading-none tracking-tight">{t("reports.widgets.title")}</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-[0.2em] font-sans">{t("reports.widgets.subtitle")}</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            if (isBuilderOpen) {
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
            } else {
              handleOpenCreateBuilder();
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            isBuilderOpen 
              ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
              : "border-border bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          }`}
          type="button"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {isBuilderOpen ? t("reports.widgets.closeBuilder") : t("reports.widgets.createWidget")}
        </button>
      </div>

      {/* Module checkboxes visibility parameters togglers */}
      {showControls && (
        <div className="bg-card/45 backdrop-blur-xl border border-border/50 p-5 rounded-2xl space-y-4 shadow-sm">
          <div>
            <h4 className="text-xs font-black text-foreground uppercase tracking-widest leading-none">{t("reports.widgets.controlsTitle")}</h4>
            <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">{t("reports.widgets.controlsSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category === "students" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("students")}
                    onChange={() => toggleCardVisibility("students")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.studentsCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.studentsCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!sectionSettings.enrollmentChart}
                    onChange={() => toggleSectionSetting("enrollmentChart")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.enrollmentChart")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.enrollmentChartDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {category === "sessions" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("sessions")}
                    onChange={() => toggleCardVisibility("sessions")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.sessionsCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.sessionsCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("classes")}
                    onChange={() => toggleCardVisibility("classes")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.classesCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.classesCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!sectionSettings.sessionsTable}
                    onChange={() => toggleSectionSetting("sessionsTable")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.sessionsTable")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.sessionsTableDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {category === "attendance" && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("attendance")}
                    onChange={() => toggleCardVisibility("attendance")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.attendanceCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.attendanceCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!sectionSettings.attendanceChart}
                    onChange={() => toggleSectionSetting("attendanceChart")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.attendanceChart")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.attendanceChartDesc")}</p>
                  </div>
                </label>
              </>
            )}

            {(category === "financial" || category === "accounting") && (
              <>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("fees")}
                    onChange={() => toggleCardVisibility("fees")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.feeCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.feeCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!disabledCardIds.includes("outstanding")}
                    onChange={() => toggleCardVisibility("outstanding")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.outstandingInvoicesCard")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.outstandingInvoicesCardDesc")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-border bg-card/20 hover:bg-card/40 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!sectionSettings.revenueChart}
                    onChange={() => toggleSectionSetting("revenueChart")}
                    className="mt-0.5 rounded text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">{t("reports.widgets.revenueChart")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("reports.widgets.revenueChartDesc")}</p>
                  </div>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Widget Architect form */}
      <AnimatePresence>
        {isBuilderOpen && (
          <WidgetBuilder
            initialCollection={defaultCollection}
            editWidgetConfig={widgets.find((widget) => widget.id === editingWidgetId) || null}
            onCancelEdit={() => {
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
            }}
            onSaveWidget={(savedWidget) => {
              const widgetAlreadyExists = widgets.some((widget) => widget.id === savedWidget.id);
              let nextWidgets: CustomWidget[];
              if (widgetAlreadyExists) {
                nextWidgets = widgets.map((widget) => widget.id === savedWidget.id ? savedWidget : widget);
              } else {
                nextWidgets = [...widgets, savedWidget];
              }
              setWidgets(nextWidgets);
              saveObject("kpi_custom_widgets", nextWidgets);
              setIsBuilderOpen(false);
              setEditingWidgetId(null);
              window.dispatchEvent(new Event("local-database-update"));
            }}
            category={category}
          />
        )}
      </AnimatePresence>

      {/* Dynamic widgets listings config items */}
      {filteredWidgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/10 backdrop-blur p-8 text-center">
          <LayoutDashboard className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h4 className="text-sm font-black text-foreground uppercase tracking-widest">{t("reports.widgets.emptyTitle")}</h4>
          <p className="text-xs text-muted-foreground mt-1">{t("reports.widgets.emptyDescription")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWidgets.map((widget) => {
            return (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-md p-5 space-y-4 shadow-sm relative group text-left font-sans"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none block">{widget.title}</span>
                    <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
                      {widget.widgetType || "kpi"} • {t(`reports.collections.${widget.collection}` as AppTranslationKey) || widget.collection.replace("_", " ")}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Pin toggle button handles */}
                    <button
                      onClick={() => handleTogglePin(widget.id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        widget.isPinnedToDashboard 
                          ? "border-primary bg-primary/10 text-primary" 
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                      title={widget.isPinnedToDashboard ? t("reports.widgets.pinnedToDashboard") : t("reports.widgets.pinToDashboard")}
                      type="button"
                    >
                      {widget.isPinnedToDashboard ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                    {/* Edit configuration settings */}
                    <button
                      onClick={() => handleEditClick(widget)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title={t("reports.widgets.editWidget")}
                      type="button"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Deletion handle triggers */}
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title={t("reports.widgets.deleteWidget")}
                      type="button"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <CustomWidgetRenderer
                  widget={widget}
                  collections={collections}
                  onSwitchToggle={handleToggleSwitchStateLocal}
                  onMetricClick={() => {}}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface WidgetBuilderProps {
  initialCollection: CustomWidget["collection"];
  editWidgetConfig: CustomWidget | null;
  onCancelEdit: () => void;
  onSaveWidget: (widget: CustomWidget) => void;
  category?: string;
  mode?: "dashboard" | "kpi";
  initialWidgetType?: CustomWidget["widgetType"];
}

/**
 * Reusable Widget Builder configuration panel conforming to best practices.
 */
export function WidgetBuilder({
  initialCollection,
  editWidgetConfig,
  onCancelEdit,
  onSaveWidget,
  category = "students",
  mode = "kpi",
  initialWidgetType = "kpi"
}: WidgetBuilderProps): React.JSX.Element {
  const collections = useMemo(() => getWidgetCollections(), []);
  const palette = useBrandPalette();
  const { t } = useTranslation();
  
  const [widgetType, setWidgetType] = useState<CustomWidget["widgetType"]>(() => {
    if (editWidgetConfig) return editWidgetConfig.widgetType || "kpi";
    return initialWidgetType || "kpi";
  });
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderCollection, setBuilderCollection] = useState<CustomWidget["collection"]>(initialCollection);
  const [builderOperation, setBuilderOperation] = useState<CustomWidget["operation"]>("count");
  const [builderTargetField, setBuilderTargetField] = useState("");
  const [builderFilterField, setBuilderFilterField] = useState("");
  const [builderFilterOperator, setBuilderFilterOperator] = useState<CustomWidget["filterOperator"]>("equals");
  const [builderFilterValue, setBuilderFilterValue] = useState("");
  const [builderColor, setBuilderColor] = useState("emerald");

  // Threshold alerts builder state
  const [thresholdEnabled, setThresholdEnabled] = useState(false);
  const [thresholdCondition, setThresholdCondition] = useState<"lt" | "gt" | "equals">("lt");
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdColor, setThresholdColor] = useState<"red" | "amber" | "yellow">("red");

  // Switch utility builder state
  const [switchActionType, setSwitchActionType] = useState<"app_setting" | "db_record">("app_setting");
  const [switchStateKey, setSwitchStateKey] = useState("app_setting_attendance_lock");
  const [switchCollection, setSwitchCollection] = useState<CustomWidget["collection"]>("students");
  const [switchRecordId, setSwitchRecordId] = useState("");
  const [switchField, setSwitchField] = useState("status");
  const [switchLabelOn, setSwitchLabelOn] = useState("ON");
  const [switchLabelOff, setSwitchLabelOff] = useState("OFF");

  // Card-specific builder state
  const [builderIcon, setBuilderIcon] = useState("GraduationCap");
  const [subTextType, setSubTextType] = useState<"fixed" | "dynamic">("dynamic");
  const [fixedSubText, setFixedSubText] = useState("");
  const [trend, setTrend] = useState<number>(0);
  const [trendType, setTrendType] = useState<"manual" | "database">("database");
  const [builderRole, setBuilderRole] = useState("admin");

  // Icon search & categories
  const [iconSearch, setIconSearch] = useState("");
  const [activeIconTab, setActiveIconTab] = useState<"all" | "academic" | "finance" | "status" | "general">("all");

  // Scalability Tester Slider size state
  const [scalerSize, setScalerSize] = useState(180);

  // Sync edits
  useEffect(() => {
    if (editWidgetConfig) {
      setWidgetType(editWidgetConfig.widgetType || "kpi");
      setBuilderTitle(editWidgetConfig.title);
      setBuilderCollection(editWidgetConfig.collection);
      setBuilderOperation(editWidgetConfig.operation);
      setBuilderTargetField(editWidgetConfig.targetField || "");
      setBuilderFilterField(editWidgetConfig.filterField || "");
      setBuilderFilterOperator(editWidgetConfig.filterOperator || "equals");
      setBuilderFilterValue(editWidgetConfig.filterValue || "");
      setBuilderColor(editWidgetConfig.color || "emerald");
      setThresholdEnabled(!!editWidgetConfig.thresholdEnabled);
      setThresholdCondition(editWidgetConfig.thresholdCondition || "lt");
      setThresholdValue(editWidgetConfig.thresholdValue !== undefined ? String(editWidgetConfig.thresholdValue) : "");
      setThresholdColor(editWidgetConfig.thresholdColor || "red");
      setSwitchActionType(editWidgetConfig.switchActionType || "app_setting");
      setSwitchStateKey(editWidgetConfig.switchStateKey || "app_setting_attendance_lock");
      setSwitchCollection(editWidgetConfig.switchCollection || initialCollection);
      setSwitchRecordId(editWidgetConfig.switchRecordId || "");
      setSwitchField(editWidgetConfig.switchField || "status");
      setSwitchLabelOn(editWidgetConfig.switchLabelOn || "ON");
      setSwitchLabelOff(editWidgetConfig.switchLabelOff || "OFF");
      
      setBuilderIcon(editWidgetConfig.icon || "GraduationCap");
      setSubTextType(editWidgetConfig.subTextType || "dynamic");
      setFixedSubText(editWidgetConfig.fixedSubText || "");
      setTrend(editWidgetConfig.trend || 0);
      setTrendType(editWidgetConfig.trendType || "database");
      setBuilderRole(editWidgetConfig.role || "admin");
    } else {
      setWidgetType("kpi");
      setBuilderTitle("");
      setBuilderCollection(initialCollection);
      setBuilderOperation("count");
      setBuilderTargetField("");
      setBuilderFilterField("");
      setBuilderFilterOperator("equals");
      setBuilderFilterValue("");
      setBuilderColor("emerald");
      setThresholdEnabled(false);
      setThresholdValue("");
      setSwitchActionType("app_setting");
      setSwitchStateKey("app_setting_attendance_lock");
      setSwitchCollection(initialCollection);
      setSwitchRecordId("");
      setSwitchLabelOn("ON");
      setSwitchLabelOff("OFF");
      
      setBuilderIcon("GraduationCap");
      setSubTextType("dynamic");
      setFixedSubText("");
      setTrend(0);
      setTrendType("database");
      setBuilderRole("admin");
    }
  }, [editWidgetConfig, initialCollection]);

  // Load record options for DB Record switch selector
  const dbRecordsList = useMemo(() => {
    if (switchCollection === "sessions") {
      const sessionRecords = (collections.sessions || []) as Session[];
      return sessionRecords.flatMap((session: Session) => 
        (session.classes || []).map((sessionClass: Class) => ({ id: sessionClass.id, label: `${session.name} - ${sessionClass.name}` }))
      );
    }
    const collectionRecords = (collections[switchCollection] || []) as { id?: string | number; name?: string; studentName?: string; invoiceNo?: string }[];
    return collectionRecords.map((collectionRecord) => ({
      id: String(collectionRecord.id),
      label: String(collectionRecord.name || collectionRecord.studentName || collectionRecord.invoiceNo || collectionRecord.id)
    }));
  }, [switchCollection, collections]);

  useEffect(() => {
    if (dbRecordsList.length > 0 && !switchRecordId) {
      setSwitchRecordId(dbRecordsList[0].id);
    }
  }, [dbRecordsList, switchRecordId]);

  // Update builder fields when collection changes
  useEffect(() => {
    if (editWidgetConfig && editWidgetConfig.collection === builderCollection) {
      return;
    }
    const meta = METADATA_FIELDS[builderCollection];
    if (meta) {
      const fields = meta.fields;
      const firstField = fields[0];
      setBuilderFilterField(firstField ? firstField.value : "");
      const numFields = meta.numericFields;
      const firstNumField = numFields[0];
      setBuilderTargetField(firstNumField ? firstNumField.value : "");
    }
  }, [builderCollection, editWidgetConfig]);

  // Build temporary Preview Widget config dynamically
  const previewWidget = useMemo<CustomWidget>(() => {
    return {
      id: editWidgetConfig?.id || "preview",
      title: builderTitle || "Custom Live Widget",
      category: editWidgetConfig?.category || category,
      collection: builderCollection,
      widgetType,
      operation: builderOperation,
      targetField: builderTargetField,
      filterField: builderFilterField,
      filterOperator: builderFilterOperator,
      filterValue: builderFilterValue,
      color: builderColor,
      isPinnedToDashboard: editWidgetConfig?.isPinnedToDashboard || false,
      thresholdEnabled,
      thresholdCondition,
      thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
      thresholdColor,
      switchActionType,
      switchStateKey,
      switchCollection,
      switchRecordId,
      switchField,
      switchLabelOn,
      switchLabelOff,
      icon: builderIcon,
      subTextType,
      fixedSubText,
      trend,
      trendType,
      role: builderRole
    };
  }, [
    builderTitle, category, builderCollection, widgetType, builderOperation,
    builderTargetField, builderFilterField, builderFilterOperator, builderFilterValue,
    builderColor, thresholdEnabled, thresholdCondition, thresholdValue, thresholdColor,
    switchActionType, switchStateKey, switchCollection, switchRecordId, switchField,
    switchLabelOn, switchLabelOff, editWidgetConfig,
    builderIcon, subTextType, fixedSubText, trend, trendType, builderRole
  ]);

  const handleToggleSwitchStateLocal = () => {
    // Local Switch preview toggle handler (noop)
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur-lg p-6 space-y-4 font-sans text-left">
      {/* Builder Header Warning banner detailing Single-Metric rule */}
      <div className="pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-foreground font-sans">{t("reports.widgets.builder.title")}</h4>
          <p className="text-[11px] text-muted-foreground">{t("reports.widgets.builder.subtitle")}</p>
        </div>
        <div className="flex items-start gap-2 bg-primary/10 border border-primary/20 p-2.5 rounded-xl max-w-sm">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[9.5px] text-muted-foreground leading-normal">
            <span className="font-black text-primary uppercase block mb-0.5">{t("reports.widgets.builder.singleMetricRule")}</span>
            {t("reports.widgets.builder.singleMetricRuleDesc")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Architect Inputs Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Visualizer Type selectors */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-foreground/80 uppercase tracking-wider block">{t("reports.widgets.builder.focusType")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(() => {
                const base = [
                  { id: "card", label: t("reports.widgets.builder.typeCard"), desc: t("reports.widgets.builder.typeCardDesc") },
                  { id: "kpi", label: t("reports.widgets.builder.typeKpi"), desc: t("reports.widgets.builder.typeKpiDesc") },
                  { id: "progress", label: t("reports.widgets.builder.typeProgress"), desc: t("reports.widgets.builder.typeProgressDesc") },
                  { id: "switch", label: t("reports.widgets.builder.typeSwitch"), desc: t("reports.widgets.builder.typeSwitchDesc") }
                ];
                if (builderCollection === "sessions") {
                  base.push({ id: "sessions-list", label: t("reports.widgets.builder.typeSessionsList"), desc: t("reports.widgets.builder.typeSessionsListDesc") });
                } else if (builderCollection === "attendance_records") {
                  base.push(
                    { id: "attendance-summary", label: t("reports.widgets.builder.typeAttendanceSummary"), desc: t("reports.widgets.builder.typeAttendanceSummaryDesc") },
                    { id: "attendance-rate", label: t("reports.widgets.builder.typeAttendanceRate"), desc: t("reports.widgets.builder.typeAttendanceRateDesc") }
                  );
                } else if (builderCollection === "finance_invoices") {
                  base.push(
                    { id: "fee-summary", label: t("reports.widgets.builder.typeFeeSummary"), desc: t("reports.widgets.builder.typeFeeSummaryDesc") },
                    { id: "outstanding-list", label: t("reports.widgets.builder.typeOutstandingList"), desc: t("reports.widgets.builder.typeOutstandingListDesc") },
                    { id: "overdue-obligations", label: t("reports.widgets.builder.typeOverdueObligations"), desc: t("reports.widgets.builder.typeOverdueObligationsDesc") },
                    { id: "revenue-expenses", label: t("reports.widgets.builder.typeRevenueExpenses"), desc: t("reports.widgets.builder.typeRevenueExpensesDesc") }
                  );
                } else if (builderCollection === "students") {
                  base.push({ id: "enrollment-trends", label: t("reports.widgets.builder.typeEnrollmentTrends"), desc: t("reports.widgets.builder.typeEnrollmentTrendsDesc") });
                } else if (builderCollection === "hasanat_distributions") {
                  base.push({ id: "hasanat-distribution", label: t("reports.widgets.builder.typeHasanatDistribution"), desc: t("reports.widgets.builder.typeHasanatDistributionDesc") });
                }
                return base;
              })().map((widgetTypeOption) => {
                const isSelectedType = widgetType === widgetTypeOption.id;
                return (
                  <button
                    key={widgetTypeOption.id}
                    onClick={() => {
                      setWidgetType(widgetTypeOption.id as CustomWidget["widgetType"]);
                      if (widgetTypeOption.id === "switch") {
                        setBuilderOperation("count");
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelectedType
                        ? "border-primary bg-primary/10 text-primary shadow-sm" 
                        : "border-border bg-card/30 text-muted-foreground hover:border-muted-foreground/20"
                    }`}
                    type="button"
                  >
                    <span className="text-xs font-black uppercase block">{widgetTypeOption.label}</span>
                    <span className="text-[9px] text-muted-foreground block mt-1 leading-none">{widgetTypeOption.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Title field */}
            <div className="space-y-1">
              <label className={FORM_LABEL}>{t("reports.widgets.builder.labelTitle")}</label>
              <input
                type="text"
                value={builderTitle}
                onChange={(event) => setBuilderTitle(event.target.value)}
                placeholder={t("reports.widgets.builder.placeholderTitle")}
                className={FORM_INPUT_BUILDER}
              />
            </div>

            {widgetType === "card" && mode === "dashboard" && (
              <div className="space-y-1">
                <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.dashboardRole")}</label>
                <select
                  value={builderRole}
                  onChange={(event) => setBuilderRole(event.target.value)}
                  className={`${FORM_INPUT_BUILDER} font-sans`}
                >
                  <option value="admin" className="bg-background text-foreground">{t("reports.widgets.builder.roleAdmin")}</option>
                  <option value="teacher" className="bg-background text-foreground">{t("reports.widgets.builder.roleTeacher")}</option>
                  <option value="accountant" className="bg-background text-foreground">{t("reports.widgets.builder.roleAccountant")}</option>
                </select>
              </div>
            )}

            {widgetType !== "switch" && !["sessions-list", "attendance-summary", "fee-summary", "outstanding-list", "overdue-obligations"].includes(widgetType || "") ? (
              <>
                {/* Data collection select */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.dataCollection")}</label>
                  <select
                    value={builderCollection}
                    onChange={(event) => setBuilderCollection(event.target.value as CustomWidget["collection"])}
                    className={FORM_INPUT_BUILDER}
                  >
                    {COLLECTION_OPTIONS.map((collectionOption) => (
                      <option key={collectionOption.value} value={collectionOption.value} className="bg-background text-foreground">
                        {t(`reports.collections.${collectionOption.value}` as AppTranslationKey) || collectionOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operation type */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.calcFormula")}</label>
                  <select
                    value={builderOperation}
                    onChange={(event) => setBuilderOperation(event.target.value as CustomWidget["operation"])}
                    className={FORM_INPUT_BUILDER}
                  >
                    <option value="count" className="bg-background text-foreground">{t("reports.widgets.builder.formulaCount")}</option>
                    <option value="percentage" className="bg-background text-foreground">{t("reports.widgets.builder.formulaPercentage")}</option>
                    <option value="sum" className="bg-background text-foreground">{t("reports.widgets.builder.formulaSum")}</option>
                    <option value="avg" className="bg-background text-foreground">{t("reports.widgets.builder.formulaAvg")}</option>
                  </select>
                </div>

                {/* Target fields for numeric values */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>
                    {t("reports.widgets.builder.targetField")} {["count", "percentage"].includes(builderOperation) && t("reports.widgets.builder.deactivated")}
                  </label>
                  <select
                    disabled={["count", "percentage"].includes(builderOperation)}
                    value={builderTargetField}
                    onChange={(event) => setBuilderTargetField(event.target.value)}
                    className={`${FORM_INPUT_BUILDER} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {METADATA_FIELDS[builderCollection].numericFields.length === 0 ? (
                      <option value="" className="bg-background text-foreground">{t("reports.widgets.builder.noNumericFields")}</option>
                    ) : (
                      METADATA_FIELDS[builderCollection].numericFields.map((numericField) => (
                        <option key={numericField.value} value={numericField.value} className="bg-background text-foreground">
                          {t(`reports.fields.${numericField.value}` as AppTranslationKey) || numericField.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Filter fields options */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.filterField")}</label>
                  <select
                    value={builderFilterField}
                    onChange={(event) => setBuilderFilterField(event.target.value)}
                    className={FORM_INPUT_BUILDER}
                  >
                    <option value="" className="bg-background text-foreground">{t("reports.widgets.builder.noFilter")}</option>
                    {METADATA_FIELDS[builderCollection].fields.map((metadataField) => (
                      <option key={metadataField.value} value={metadataField.value} className="bg-background text-foreground">
                        {t(`reports.fields.${metadataField.value}` as AppTranslationKey) || metadataField.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Query filter condition inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.operator")}</label>
                    <select
                      disabled={!builderFilterField}
                      value={builderFilterOperator}
                      onChange={(event) => setBuilderFilterOperator(event.target.value as CustomWidget["filterOperator"])}
                      className={`${FORM_INPUT_BUILDER} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <option value="equals" className="bg-background text-foreground">{t("reports.widgets.builder.opEquals")}</option>
                      <option value="contains" className="bg-background text-foreground">{t("reports.widgets.builder.opContains")}</option>
                      <option value="gt" className="bg-background text-foreground">&gt; {t("reports.widgets.builder.opGt")}</option>
                      <option value="lt" className="bg-background text-foreground">&lt; {t("reports.widgets.builder.opLt")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.matchValue")}</label>
                    <input
                      type="text"
                      disabled={!builderFilterField}
                      value={builderFilterValue}
                      onChange={(event) => setBuilderFilterValue(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderValue")}
                      className={`${FORM_INPUT_BUILDER} disabled:opacity-40 disabled:cursor-not-allowed`}
                    />
                  </div>
                </div>

                {widgetType === "card" && (
                  <>
                    <div className="space-y-1">
                      <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.subtextStyle")}</label>
                      <select
                        value={subTextType}
                        onChange={(event) => setSubTextType(event.target.value as "fixed" | "dynamic")}
                        className={`${FORM_INPUT_BUILDER} font-sans`}
                      >
                        <option value="dynamic" className="bg-background text-foreground">{t("reports.widgets.builder.subtextDynamic")}</option>
                        <option value="fixed" className="bg-background text-foreground">{t("reports.widgets.builder.subtextFixed")}</option>
                      </select>
                    </div>

                    {subTextType === "fixed" && (
                      <div className="space-y-1">
                        <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.fixedSubtitle")}</label>
                        <input
                          type="text"
                          value={fixedSubText}
                          onChange={(event) => setFixedSubText(event.target.value)}
                          placeholder={t("reports.widgets.builder.placeholderSubtitle")}
                          className={FORM_INPUT_BUILDER}
                        />
                      </div>
                    )}

                    <div className="space-y-1 col-span-1 sm:col-span-2 border-t border-border/40 pt-3">
                      <label className={`${FORM_LABEL} block`}>
                        {t("reports.widgets.builder.trendSource")}
                      </label>
                      <div className="grid grid-cols-2 gap-2 bg-card/20 border border-border/60 p-1 rounded-xl max-w-sm">
                        <button
                          type="button"
                          onClick={() => setTrendType("database")}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            trendType === "database"
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("reports.widgets.builder.sourceDb")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrendType("manual")}
                          className={`py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                            trendType === "manual"
                              ? "bg-primary text-primary-foreground shadow"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t("reports.widgets.builder.sourceManual")}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 col-span-1 sm:col-span-2">
                      {trendType === "database" ? (
                        <p className="text-[10px] text-muted-foreground italic leading-normal bg-primary/5 p-3 rounded-xl border border-primary/10">
                          ⚡ {t("reports.widgets.builder.dynamicModeDesc")}
                        </p>
                      ) : (
                        <>
                          <div className="flex justify-between items-center select-none">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{t("reports.widgets.builder.manualTrend")}</label>
                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                              trend > 0 ? "bg-success/20 text-success" : trend < 0 ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              {trend > 0 ? "+" : ""}{trend}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={trend}
                              onChange={(event) => setTrend(Number(event.target.value))}
                              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setTrend(0)}
                              className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                              title={t("reports.widgets.builder.resetTrend")}
                            >
                              {t("reports.widgets.builder.reset")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Switch options fields */}
                <div className="space-y-1">
                  <label className={FORM_LABEL}>{t("reports.widgets.builder.switchTarget")}</label>
                  <select
                    value={switchActionType}
                    onChange={(event) => setSwitchActionType(event.target.value as "app_setting" | "db_record")}
                    className={FORM_INPUT_BUILDER}
                  >
                    <option value="app_setting" className="bg-background text-foreground">{t("reports.widgets.builder.switchTargetApp")}</option>
                    <option value="db_record" className="bg-background text-foreground">{t("reports.widgets.builder.switchTargetDb")}</option>
                  </select>
                </div>

                {switchActionType === "app_setting" ? (
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.selectParameter")}</label>
                    <select
                      value={switchStateKey}
                      onChange={(event) => setSwitchStateKey(event.target.value)}
                      className={FORM_INPUT_BUILDER}
                    >
                      <option value="section_enrollmentChart" className="bg-background text-foreground">{t("reports.widgets.builder.paramEnrollmentChart")}</option>
                      <option value="section_revenueChart" className="bg-background text-foreground">{t("reports.widgets.builder.paramRevenueChart")}</option>
                      <option value="section_attendanceChart" className="bg-background text-foreground">{t("reports.widgets.builder.paramAttendanceChart")}</option>
                      <option value="section_hasanatChart" className="bg-background text-foreground">{t("reports.widgets.builder.paramHasanatChart")}</option>
                      <option value="section_sessionsTable" className="bg-background text-foreground">{t("reports.widgets.builder.paramSessionsTable")}</option>
                      <option value="app_setting_attendance_lock" className="bg-background text-foreground">{t("reports.widgets.builder.paramAttendanceLock")}</option>
                      <option value="app_setting_mute_notifications" className="bg-background text-foreground">{t("reports.widgets.builder.paramMuteNotifications")}</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className={FORM_LABEL}>{t("reports.widgets.builder.recordCollection")}</label>
                      <select
                        value={switchCollection}
                        onChange={(event) => {
                          setSwitchCollection(event.target.value as CustomWidget["collection"]);
                          setSwitchRecordId("");
                        }}
                        className={FORM_INPUT_BUILDER}
                      >
                        {COLLECTION_OPTIONS.map((collectionOption) => (
                          <option key={collectionOption.value} value={collectionOption.value} className="bg-background text-foreground">{t(`reports.collections.${collectionOption.value}` as AppTranslationKey) || collectionOption.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className={FORM_LABEL}>{t("reports.widgets.builder.selectRecord")}</label>
                      <select
                        value={switchRecordId}
                        onChange={(event) => setSwitchRecordId(event.target.value)}
                        className={FORM_INPUT_BUILDER}
                      >
                        {dbRecordsList.length === 0 ? (
                          <option value="" className="bg-background text-foreground">{t("reports.widgets.builder.noRecordsLoaded")}</option>
                        ) : (
                          dbRecordsList.map(rec => (
                            <option key={rec.id} value={rec.id} className="bg-background text-foreground">{rec.label}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOn")}</label>
                    <input
                      type="text"
                      value={switchLabelOn}
                      onChange={(event) => setSwitchLabelOn(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderActive")}
                      className={FORM_INPUT_BUILDER}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOff")}</label>
                    <input
                      type="text"
                      value={switchLabelOff}
                      onChange={(event) => setSwitchLabelOff(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderInactive")}
                      className={FORM_INPUT_BUILDER}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Threshold alerts options for KPI/Progress */}
          {widgetType !== "switch" && !["sessions-list", "attendance-summary", "fee-summary", "outstanding-list", "overdue-obligations"].includes(widgetType || "") && (
            <div className="p-4 rounded-2xl border border-border bg-card/20 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={thresholdEnabled}
                  onChange={(event) => setThresholdEnabled(event.target.checked)}
                  className="rounded text-primary focus:ring-primary/20 cursor-pointer"
                />
                <span className="text-xs font-bold text-foreground">{t("reports.widgets.builder.enableThreshold")}</span>
              </label>

              {thresholdEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.triggerCondition")}</label>
                    <select
                      value={thresholdCondition}
                      onChange={(event) => setThresholdCondition(event.target.value as "lt" | "gt" | "equals")}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card/40 text-foreground outline-none"
                    >
                      <option value="lt" className="bg-background text-foreground">&lt; {t("reports.widgets.builder.conditionLt")}</option>
                      <option value="gt" className="bg-background text-foreground">&gt; {t("reports.widgets.builder.conditionGt")}</option>
                      <option value="equals" className="bg-background text-foreground">= {t("reports.widgets.builder.conditionEquals")}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.thresholdValue")}</label>
                    <input
                      type="number"
                      value={thresholdValue}
                      onChange={(event) => setThresholdValue(event.target.value)}
                      placeholder={t("reports.widgets.builder.placeholderThreshold")}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card/40 text-foreground outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{t("reports.widgets.builder.alertColor")}</label>
                    <select
                      value={thresholdColor}
                      onChange={(event) => setThresholdColor(event.target.value as "red" | "amber" | "yellow")}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-card/40 text-foreground outline-none"
                    >
                      <option value="red" className="text-destructive bg-background">{t("reports.widgets.builder.colorRed")}</option>
                      <option value="amber" className="text-warning bg-background">{t("reports.widgets.builder.colorAmber")}</option>
                      <option value="yellow" className="text-warning bg-background">{t("reports.widgets.builder.colorYellow")}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Palette selecting color */}
          <div className="space-y-1.5 text-left font-sans">
            <label className={`${FORM_LABEL} block`}>{t("reports.widgets.builder.defaultColor")}</label>
            <div className="flex flex-wrap gap-2">
              {["emerald", "blue", "violet", "amber", "red"].map((colorName) => {
                const isSelected = builderColor === colorName;
                const cMap = resolveWidgetChartHex(colorName, palette);
                return (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setBuilderColor(colorName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-border hover:border-muted-foreground/30 text-muted-foreground bg-card/25"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/5 flex-shrink-0" style={{ background: cMap }} />
                    {colorName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable Icon Selection Grid */}
          {widgetType === "card" && (
            <div className="space-y-2 pt-3 border-t border-border/45 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("reports.widgets.builder.iconSelector")}
                </label>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" style={{ width: 14, height: 14 }} />
                  <input
                    type="text"
                    placeholder={t("reports.widgets.builder.searchIcons")}
                    value={iconSearch}
                    onChange={(event) => setIconSearch(event.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-border bg-card/20 backdrop-blur-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold animate-fade-in"
                  />
                </div>
              </div>
              {/* Icon Categories */}
              <div className="flex flex-wrap gap-1 mb-2 select-none">
                {(["all", "academic", "finance", "status", "general"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveIconTab(tab)}
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      activeIconTab === tab
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    {t(`reports.widgets.builder.cat${tab.charAt(0).toUpperCase() + tab.slice(1)}` as AppTranslationKey) || tab}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 bg-card/20 border border-border/50 p-2.5 rounded-2xl max-h-[110px] overflow-y-auto pr-1">
                {(() => {
                  const ICON_CATEGORIES: Record<string, string[]> = {
                    academic: ["GraduationCap", "Users", "UserCheck", "Award", "ShieldCheck", "BookOpen"],
                    finance: ["DollarSign", "TrendingUp", "Receipt", "Target", "PieChart", "Activity", "Briefcase", "BarChart2"],
                    status: ["CalendarCheck", "AlertCircle", "Clock", "CheckCircle2", "Zap"],
                    general: ["Star", "Heart"]
                  };
                  const filteredIcons = Object.keys(ICONS_LIST).filter((name) => {
                    const matchesSearch = name.toLowerCase().includes(iconSearch.toLowerCase());
                    if (!matchesSearch) return false;
                    if (activeIconTab === "all") return true;
                    return ICON_CATEGORIES[activeIconTab]?.includes(name) || false;
                  });
                  if (filteredIcons.length === 0) {
                    return <p className="text-[10px] text-muted-foreground italic col-span-full py-2 text-center font-sans">{t("reports.widgets.builder.noIconsFound")}</p>;
                  }
                  return filteredIcons.map((iconName) => {
                    const Icon = ICONS_LIST[iconName];
                    const active = builderIcon === iconName;
                    if (!Icon) return null;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setBuilderIcon(iconName)}
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer hover:scale-105 ${
                          active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title={iconName}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          )}

        </div>

        {/* Scalability Testing Preview Column */}
        <div className="p-4 rounded-2xl border border-border bg-card/10 backdrop-blur-xl flex flex-col justify-between relative min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-left">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">{t("reports.widgets.builder.testerPreview")}</span>
              <span className="text-[9px] text-primary font-bold">{scalerSize}x{scalerSize}px</span>
            </div>

            {/* Size slider widget scalability demonstrator */}
            <div className="space-y-1 bg-card/30 p-2.5 rounded-xl border border-border/50">
              <label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">{t("reports.widgets.builder.dragToScale")}</label>
              <input
                type="range"
                min={100}
                max={250}
                value={scalerSize}
                onChange={(event) => setScalerSize(Number(event.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Centered sizing container */}
            <div className="flex items-center justify-center py-4 bg-muted/10 rounded-2xl border border-dashed border-border/60 min-h-[220px]">
              <div 
                className="overflow-hidden border border-border shadow-lg rounded-3xl transition-all duration-100 flex items-center justify-center bg-card/40 backdrop-blur-md animate-fade-in"
                style={{ width: scalerSize, height: scalerSize }}
              >
                <CustomWidgetRenderer
                  widget={previewWidget}
                  collections={collections}
                  isCompact={scalerSize < 140}
                  onSwitchToggle={handleToggleSwitchStateLocal}
                  onMetricClick={() => {}}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 py-2.5 rounded-xl border border-border bg-card/50 hover:bg-muted text-foreground font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer font-sans"
            >
              {t("reports.widgets.builder.cancel")}
            </button>
            <button
              type="button"
              disabled={!builderTitle}
              onClick={() => {
                onSaveWidget({
                  id: editWidgetConfig?.id || "widget-" + Date.now(),
                  title: builderTitle,
                  category: editWidgetConfig?.category || category,
                  collection: builderCollection,
                  widgetType,
                  operation: builderOperation,
                  targetField: builderTargetField,
                  filterField: builderFilterField,
                  filterOperator: builderFilterOperator,
                  filterValue: builderFilterValue,
                  color: builderColor,
                  isPinnedToDashboard: editWidgetConfig?.isPinnedToDashboard || false,
                  thresholdEnabled,
                  thresholdCondition,
                  thresholdValue: thresholdValue ? Number(thresholdValue) : undefined,
                  thresholdColor,
                  switchActionType,
                  switchStateKey,
                  switchCollection,
                  switchRecordId,
                  switchField,
                  switchLabelOn,
                  switchLabelOff,
                  icon: widgetType === "card" ? builderIcon : undefined,
                  subTextType: widgetType === "card" ? subTextType : undefined,
                  fixedSubText: (widgetType === "card" && subTextType === "fixed") ? fixedSubText : undefined,
                  trend: widgetType === "card" ? trend : undefined,
                  trendType: widgetType === "card" ? trendType : undefined,
                  role: (widgetType === "card" && mode === "dashboard") ? builderRole : undefined
                });
              }}
              className="flex-[2] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/20 shadow-primary/10 cursor-pointer font-sans"
            >
              {editWidgetConfig ? t("reports.widgets.builder.updateWidget") : t("reports.widgets.builder.createWidget")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
