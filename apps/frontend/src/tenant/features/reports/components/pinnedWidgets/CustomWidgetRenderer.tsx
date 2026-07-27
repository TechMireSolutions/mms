import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  X, ArrowUpRight, ArrowRight, Users, EyeOff
} from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney, capitalize, type AppTranslationKey } from "@mms/shared";
import { notify } from "@/lib/notify";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { resolveWidgetTitle, resolveWidgetSubText } from "@/lib/dashboardWidgets";
import {
  ComposedDashboardWidget,
  COMPOSED_WIDGET_TYPES,
  isComposedWidgetType,
} from "@/components/dashboard-widgets/registry";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { resolveThresholdChartHex, resolveWidgetChartHex } from "@/lib/brandingChartPalette";
import { METADATA_FIELDS, computeCustomCard, CustomCard, getCollectionLabel, getFieldLabel } from "@/tenant/features/reports/components/reportMetadata";
import { getCollection, saveCollection, getObject } from "@/lib/db";
import {
  CustomWidget,
  ALERT_COLOR_MAP,
  COLOR_MAP,
  ICONS_LIST,
} from "@/tenant/features/reports/components/pinnedWidgets/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  getWidgetCollections,
  getFilteredRecords,
  computeWidgetSingleValue,
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";

const CustomWidgetChartFallback = React.lazy(() => import("@/tenant/features/reports/components/pinnedWidgets/CustomWidgetChartFallback"));

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
}

/**
 * Focused overlay drilldown modal for micro-interactions.
 * Displays details of records matching the single metric.
 */
export function WidgetDrilldownModal({
  widget,
  onClose
}: {
  widget: CustomWidget;
  onClose: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [collections, setCollections] = useState(() => getWidgetCollections());

  useEffect(() => {
    const handleUpdate = () => {
      setCollections(getWidgetCollections());
    };
    window.addEventListener("local-database-update", handleUpdate);
    return () => window.removeEventListener("local-database-update", handleUpdate);
  }, []);

  const widgetRecords = useMemo(() => getFilteredRecords(widget, collections), [widget, collections]);

  const {
    searchQuery: search,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems: paginatedRecords,
    filteredItems: filteredRecords,
    totalPages,
  } = useLocalPagination({
    items: widgetRecords,
    pageSize: 10,
    filterFn: (record, query) =>
      Object.values(record).some((fieldValue) =>
        String(fieldValue).toLowerCase().includes(query)
      ),
  });

  const students = useMemo(() => collections.students, [collections]);
  const studentNameMap = useMemo(() => {
    return new Map((students as unknown as Record<string, unknown>[]).map((student) => [String(student.id), String(student.name || student.studentName || student.id)]));
  }, [students]);

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
      notify.error(t("reports.widgets.errorToggleFailed"));
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
      notify.error(t("reports.widgets.errorDeleteFailed"));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
        className="w-full max-w-2xl bg-card dark:bg-card/90 border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border/45 bg-muted/20 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-primary uppercase font-black tracking-widest block">{t("reports.widgets.drilldownTitle")}</span>
            <h3 className="text-base font-black text-foreground">{t("reports.widgets.records", { title: resolveWidgetTitle(widget, t) })}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Search Bar */}
        <div className="p-4 border-b border-border/45 bg-muted/10 flex items-center justify-between gap-4">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder={t("reports.widgets.searchRecords")}
            className="flex-1 max-w-sm"
          />
          <span className="text-[10px] text-muted-foreground font-bold px-2 py-1.5 bg-muted rounded-full border border-border flex-shrink-0">
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
              <Table className="w-full text-xs">
                <TableHeader>
                  <TableRow className="border-b border-border text-muted-foreground uppercase font-black text-[9px] tracking-wider text-left hover:bg-transparent">
                    <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.refName")}</TableHead>
                    <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.primaryInfo")}</TableHead>
                    <TableHead className="pb-3 text-muted-foreground h-auto">{t("reports.widgets.currentStatus")}</TableHead>
                    <TableHead className="pb-3 text-right text-muted-foreground h-auto">{t("reports.widgets.microAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/60">
                  {paginatedRecords.map((recordSource, index) => {
                    const displayRecord = recordSource as unknown as WidgetRecordFields;
                    const recordId = String(displayRecord.id || index);
                    
                    // Format columns based on collection
                    let name = String(displayRecord.name || displayRecord.studentName || displayRecord.invoiceNo || displayRecord.id);
                    let detailText = "";
                    let status = String(displayRecord.status || "active");
                    let hasAction = true;
                    
                    if (widget.collection === "students") {
                      name = String(displayRecord.name || "");
                      detailText = t("reports.widgets.ageText", {
                        age: String(displayRecord.age || t("common.notAvailable")),
                        gender: displayRecord.gender ? getFieldLabel(displayRecord.gender, displayRecord.gender, t) : t("reports.widgets.any")
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
                      detailText = t("reports.widgets.qtyText", { denomination: displayRecord.denominationName || t("reports.widgets.defaultDenomination"), qty: displayRecord.quantity || 1 });
                      status = t("reports.widgets.pointsText", { points: displayRecord.points || 50 });
                      hasAction = false; // deleting is the action instead of toggling status
                    } else if (widget.collection === "contacts") {
                      detailText = `${displayRecord.email || t("reports.widgets.noEmail")} • ${displayRecord.gender || t("contacts.gender.male")}`;
                      status = displayRecord.isActive !== false ? "active" : "inactive";
                    } else if (widget.collection === "sessions") {
                      name = String(displayRecord.name || "");
                      detailText = t("reports.widgets.roomText", { type: displayRecord.type || t("reports.widgets.defaultSessionType"), room: displayRecord.room || t("common.notAvailable") });
                    }
 
                    return (
                      <TableRow key={recordId} className="hover:bg-muted/10">
                        <TableCell className="py-3.5 pr-2 font-bold text-foreground max-w-[180px] truncate">{name}</TableCell>
                        <TableCell className="py-3.5 text-muted-foreground font-semibold">{detailText}</TableCell>
                        <TableCell className="py-3.5">
                          <StatusBadge
                            status={status.toLowerCase()}
                            size="sm"
                            config={{
                              active: { label: t("reports.status.active"), cls: SEMANTIC_BADGE.success },
                              paid: { label: t("reports.status.paid"), cls: SEMANTIC_BADGE.success },
                              present: { label: t("reports.status.present"), cls: SEMANTIC_BADGE.success },
                              customer: { label: t("reports.status.customer"), cls: SEMANTIC_BADGE.success },
                              inactive: { label: t("reports.status.inactive"), cls: SEMANTIC_BADGE.destructive },
                              unpaid: { label: t("reports.status.unpaid"), cls: SEMANTIC_BADGE.destructive },
                              absent: { label: t("reports.status.absent"), cls: SEMANTIC_BADGE.destructive },
                              lead: { label: t("reports.status.lead"), cls: SEMANTIC_BADGE.destructive },
                              cancelled: { label: t("reports.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
                            }}
                          />
                        </TableCell>
                        <TableCell className="py-3.5 text-right">
                          {widget.collection === "hasanat_distributions" ? (
                            <Button
                              onClick={() => handleDeleteDist(recordId)}
                              variant="destructive"
                              className="h-6 px-2.5 rounded text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer font-bold uppercase tracking-wider text-[9px] shadow-none"
                            >
                              {t("reports.widgets.delete")}
                            </Button>
                          ) : hasAction ? (
                            <Button
                              onClick={() => handleToggleStatus(recordId)}
                              variant="secondary"
                              className="h-6 px-2.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-transparent hover:border-transparent transition-all cursor-pointer font-bold uppercase tracking-wider text-[9px] shadow-none"
                            >
                              {t("reports.widgets.toggleStatus")}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Modal Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border/45 bg-muted/20 flex items-center justify-end select-none text-xs gap-4">
            <span className="text-[11px] font-bold text-muted-foreground">
              {t("reports.widgets.foundCount", { count: filteredRecords.length })}
            </span>
              <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
          </div>
        )}
      </motion.div>
    </motion.div>
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
export function CustomWidgetRenderer({
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
  
  const resolvedWidgetType = useMemo(() => {
    const type = widget.widgetType || "";
    if (["bar", "line", "area", "pie", "radar"].includes(type) || ["bar", "line", "area", "pie", "radar"].includes(widget.chartType || "")) {
      return "chart";
    }
    const knownTypes = [
      "kpi", "progress", "switch", "card",
      ...COMPOSED_WIDGET_TYPES,
    ];
    if (knownTypes.includes(type)) {
      return type;
    }
    return "kpi";
  }, [widget.widgetType, widget.chartType]);

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
    const collectionRecords = (collections[collectionName] || []) as unknown[];
    const matchedRecord = collectionRecords.find((candidate) => {
      const record = candidate as Record<string, unknown>;
      return record && String(record.id) === String(recordId);
    });
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
          title: resolveWidgetTitle(card, t),
          value: String(aggregateValue.finalValue),
          sub: resolveWidgetSubText(card, t) || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
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
          title: resolveWidgetTitle(card, t),
          value: String(aggregateValue.finalValue),
          sub: resolveWidgetSubText(card, t) || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
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
          title: resolveWidgetTitle(card, t),
          value: String(aggregateValue.finalValue),
          sub: resolveWidgetSubText(card, t) || t("reports.widgets.totalCountText", { count: aggregateValue.totalCount }),
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
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          onClick={() => onMetricClick(widget)}
          className="w-[100px] h-[100px] p-2.5 text-center flex flex-col justify-between items-center rounded-2xl cursor-pointer outline-none select-none relative overflow-hidden surface-glass hover:border-primary/20 hover:shadow-md"
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {resolveWidgetTitle(widget, t)}
          </span>
          <span className="text-base font-black tracking-tight font-mono my-auto max-w-full truncate text-foreground">
            {computed.value}
          </span>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t)}
          </span>
        </motion.button>
      );
    }
    
    return (
      <motion.div
        layout
        whileHover={{ y: -4, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="rounded-2xl surface-glass p-5 hover:shadow-surface-lg transition-all relative text-left flex flex-col justify-between min-h-[140px] font-sans overflow-hidden group"
      >
        <div className={`absolute start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] ${colorClasses.bar}/60 group-hover:${colorClasses.bar} transition-colors duration-300`} />
        <div className={`absolute -right-8 -top-8 w-20 h-20 rounded-full ${colorClasses.glow} transition-all duration-500`} />
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
      </motion.div>
    );
  }

  const colorHex = isAlert
    ? resolveThresholdChartHex(widget.thresholdColor, palette)
    : resolveWidgetChartHex(widget.color, palette);

  const alertScheme = isAlert ? ALERT_COLOR_MAP[widget.thresholdColor || "red"] : null;

  // Handle Switch inline toggle
  const handleSwitchClick = () => {
    onSwitchToggle(widget);
  };

  const switchLabel = isSwitchOn
    ? (widget.switchLabelOnKey ? t(widget.switchLabelOnKey) : (widget.switchLabelOn || t("reports.widgets.statusOn")))
    : (widget.switchLabelOffKey ? t(widget.switchLabelOffKey) : (widget.switchLabelOff || t("reports.widgets.statusOff")));

  // Compact size (100x100px) widget layouts
  if (isCompact) {
    if (isComposedWidgetType(resolvedWidgetType)) {
      const displayAsProgress = resolvedWidgetType === "attendance-summary";
      if (displayAsProgress) {
        return (
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            onClick={() => onMetricClick(widget)}
            className={`w-[100px] h-[100px] p-1.5 text-center flex flex-col justify-between items-center rounded-2xl border cursor-pointer outline-none select-none relative overflow-hidden ${
              alertScheme 
                ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
                : "surface-glass hover:border-primary/20 hover:shadow-md"
            }`}
            type="button"
          >
            <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
              {resolveWidgetTitle(widget, t)}
            </span>
            <div className="my-auto">
              <ProgressRing percentage={value} colorHex={colorHex} isCompact />
            </div>
            <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
              {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t)}
            </span>
          </motion.button>
        );
      } else {
        return (
          <motion.button
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            onClick={() => onMetricClick(widget)}
            className={`w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border cursor-pointer outline-none select-none relative overflow-hidden ${
              alertScheme 
                ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
                : "surface-glass hover:border-primary/20 hover:shadow-md"
            }`}
            type="button"
          >
            <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
              {resolveWidgetTitle(widget, t)}
            </span>
            <span className={`text-base font-black tracking-tight font-mono my-auto max-w-full truncate ${alertScheme ? alertScheme.text : "text-foreground"}`}>
              {formattedValue}
            </span>
            <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
              {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t)}
            </span>
          </motion.button>
        );
      }
    }

    if (resolvedWidgetType === "kpi") {
      return (
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          onClick={() => onMetricClick(widget)}
          className={`w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl border cursor-pointer outline-none select-none relative overflow-hidden ${
            alertScheme 
              ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
              : "surface-glass hover:border-primary/20 hover:shadow-md"
          }`}
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {resolveWidgetTitle(widget, t)}
          </span>
          <span className={`text-base font-black tracking-tight font-mono my-auto max-w-full truncate ${alertScheme ? alertScheme.text : "text-foreground"}`}>
            {formattedValue}
          </span>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t)}
          </span>
        </motion.button>
      );
    }

    if (resolvedWidgetType === "progress") {
      return (
        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 20 }}
          onClick={() => onMetricClick(widget)}
          className={`w-[100px] h-[100px] p-1.5 text-center flex flex-col justify-between items-center rounded-2xl border cursor-pointer outline-none select-none relative overflow-hidden ${
            alertScheme 
              ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} animate-pulse` 
              : "surface-glass hover:border-primary/20 hover:shadow-md"
          }`}
          type="button"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {resolveWidgetTitle(widget, t)}
          </span>
          <div className="my-auto">
            <ProgressRing percentage={value} colorHex={colorHex} isCompact />
          </div>
          <span className="text-[6.5px] font-black text-muted-foreground/60 uppercase tracking-widest mb-0.5">
            {getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t)}
          </span>
        </motion.button>
      );
    }

    if (resolvedWidgetType === "switch") {
      return (
        <div
          className="w-[100px] h-[100px] p-2 text-center flex flex-col justify-between items-center rounded-2xl surface-glass overflow-hidden relative transition-all duration-300 hover:border-primary/20 hover:shadow-md"
        >
          <span className="text-[7.5px] font-black uppercase text-muted-foreground tracking-wider line-clamp-1 w-full mt-0.5">
            {resolveWidgetTitle(widget, t)}
          </span>
          
          <Switch
            checked={isSwitchOn}
            onCheckedChange={() => handleSwitchClick()}
            className="h-4 w-7"
            aria-label={switchLabel}
          />

          <span className="text-[7px] font-black uppercase tracking-widest mb-0.5" style={{ color: isSwitchOn ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
            {switchLabel}
          </span>
        </div>
      );
    }
  }

  // Comfortable mode (standard card sized) layouts
  if (isComposedWidgetType(resolvedWidgetType)) {
    return (
      <ComposedDashboardWidget
        type={resolvedWidgetType}
        title={resolveWidgetTitle(widget, t)}
        isEditMode={isEditMode}
      />
    );
  }

  const colorTheme = COLOR_MAP[widget.color || ""] || COLOR_MAP.emerald;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`rounded-2xl p-5 flex flex-col justify-between shadow-sm relative group hover:shadow-surface-lg transition-all overflow-hidden ${
        alertScheme 
          ? `${alertScheme.bg} ${alertScheme.border} ${alertScheme.glow} border-[1.5px]` 
          : "surface-glass"
      }`}
    >
      <div className={`absolute start-0 top-0 bottom-0 w-[3.5px] rounded-r-[2px] transition-colors duration-300 ${
        isAlert
          ? "bg-destructive/60 group-hover:bg-destructive"
          : `${colorTheme.bar}/60`
      }`} />
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${colorTheme.glow} transition-all duration-500`} />
      {/* Widget Card Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5 text-left">
          <span className="text-[10px] font-black text-foreground uppercase tracking-widest leading-none block">
            {resolveWidgetTitle(widget, t)}
          </span>
          <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
            {(() => {
              const widgetTitle = resolveWidgetTitle(widget, t);
              const collectionLabel = getCollectionLabel(widget.collection, METADATA_FIELDS[widget.collection]?.name || widget.collection, t);
              const showCollection = !widgetTitle.toLowerCase().includes(collectionLabel.toLowerCase());
              const formulaPart = resolvedWidgetType !== "switch" ? t(`reports.widgets.builder.formula${capitalize(widget.operation)}` as AppTranslationKey) || widget.operation : "";
              return showCollection
                ? `${collectionLabel}${formulaPart ? ` • ${formulaPart}` : ""}`
                : formulaPart;
            })()}
          </p>
        </div>
        
        {isAlert && (
          <StatusBadge
            status="alert"
            size="sm"
            config={{ alert: { label: t("reports.widgets.alertLevel"), cls: `${SEMANTIC_BADGE.destructive} animate-pulse` } }}
          />
        )}
      </div>

      {/* Widget Card Body */}
      <div className="py-4 flex items-center justify-between min-h-[70px]">
        {resolvedWidgetType === "kpi" && (
          <Button
            onClick={() => onMetricClick(widget)}
            className="h-auto text-left select-none outline-none group/kpi shadow-none px-0 py-0 hover:bg-transparent"
            type="button"
            variant="ghost"
          >
            <span className="block">
            <h4 className={`text-3xl font-black tracking-tight font-mono flex items-baseline gap-1.5 ${alertScheme ? alertScheme.text : "text-foreground"}`}>
              {formattedValue}
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/35 group-hover/kpi:text-primary group-hover/kpi:translate-x-0.5 group-hover/kpi:-translate-y-0.5 transition-all" />
            </h4>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              {t("reports.widgets.clickToViewRecords")}
            </p>
            </span>
          </Button>
        )}

        {resolvedWidgetType === "progress" && (
          <div className="flex items-center gap-4 w-full">
            <Button
              onClick={() => onMetricClick(widget)}
              className="flex-1 h-auto text-left outline-none group/prog shadow-none px-0 py-0 hover:bg-transparent justify-start"
              type="button"
              variant="ghost"
            >
              <span className="block">
              <h4 className="text-sm font-black text-foreground flex items-center gap-1">
                {t("reports.widgets.progression")}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover/prog:translate-x-0.5 transition-transform" />
              </h4>
              <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                {t("reports.widgets.progressionDesc")}
              </p>
              </span>
            </Button>
            <ProgressRing percentage={value} colorHex={colorHex} />
          </div>
        )}

        {resolvedWidgetType === "switch" && (
          <div className="flex items-center justify-between w-full">
            <div className="text-left">
              <span className={`text-base font-black uppercase tracking-wider ${isSwitchOn ? "text-primary" : "text-muted-foreground"}`}>
                {switchLabel}
              </span>
              <p className="text-[9px] text-muted-foreground font-semibold mt-1">
                {t("reports.widgets.clickToToggle")}
              </p>
            </div>
            
            <Switch
              checked={isSwitchOn}
              onCheckedChange={() => handleSwitchClick()}
              className="h-6 w-11"
              aria-label={switchLabel}
            />
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


