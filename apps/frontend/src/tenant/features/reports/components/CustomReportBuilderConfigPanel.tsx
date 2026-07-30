import type { Dispatch, JSX, SetStateAction } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AGGREGATE_FNS,
  getSelectedFieldsForSource,
  type AggregateFn,
  type DataSource,
} from "./customReportBuilderFields";

interface CustomReportBuilderConfigPanelProps {
  reportName: string;
  setReportName: Dispatch<SetStateAction<string>>;
  source: DataSource;
  setSource: Dispatch<SetStateAction<DataSource>>;
  selectedFields: string[];
  setSelectedFields: Dispatch<SetStateAction<string[]>>;
  availableFields: string[];
  addField: (field: string) => void;
  aggregate: AggregateFn;
  setAggregate: Dispatch<SetStateAction<AggregateFn>>;
  groupBy: string;
  setGroupBy: Dispatch<SetStateAction<string>>;
  orientation: "p" | "l";
  setOrientation: Dispatch<SetStateAction<"p" | "l">>;
  pageSize: string;
  setPageSize: Dispatch<SetStateAction<string>>;
  resolveFieldLabel: (field: string) => string;
}

export function CustomReportBuilderConfigPanel({
  reportName,
  setReportName,
  source,
  setSource,
  selectedFields,
  setSelectedFields,
  availableFields,
  addField,
  aggregate,
  setAggregate,
  groupBy,
  setGroupBy,
  orientation,
  setOrientation,
  pageSize,
  setPageSize,
  resolveFieldLabel,
}: CustomReportBuilderConfigPanelProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 lg:col-span-1">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
          {t("reports.builder.reportTitleLabel")}
        </label>
        <Input
          type="text"
          value={reportName}
          onChange={(event) => setReportName(event.target.value)}
          placeholder={t("reports.builder.placeholderName")}
          className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-4 py-2.5 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all text-foreground h-auto"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
          {t("reports.builder.queryDataSource")}
        </label>
        <FormSelect
          value={source}
          onChange={(value) => {
            const newSource = value as DataSource;
            setSource(newSource);
            setSelectedFields(getSelectedFieldsForSource(newSource));
          }}
          options={[
            { value: "students", label: t("reports.builder.sourceStudents") },
            { value: "contacts", label: t("contacts.reportBuilder.sourceLabel") },
            { value: "attendance", label: t("reports.builder.sourceAttendance") },
            { value: "financial", label: t("reports.builder.sourceFinancial") },
            { value: "academic", label: t("reports.builder.sourceAcademic") },
            { value: "hasanat", label: t("reports.builder.sourceHasanat") },
            { value: "sessions", label: t("reports.builder.sourceSessions") },
            { value: "faculty", label: t("reports.builder.sourceFaculty") },
          ]}
          className="w-full"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center ms-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
            {t("reports.builder.schemaFieldsPicker")}
          </label>
          <span className="text-xs text-muted-foreground font-black uppercase bg-primary/10 px-1.5 py-0.5 rounded-md text-primary">
            {t("reports.builder.availableCount", { count: availableFields.length })}
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-background/30 p-2.5 space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
          {availableFields.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground italic text-xs flex flex-col items-center gap-1">
              <Check className="w-5 h-5 text-success" />
              {t("reports.builder.allFieldsSelected")}
            </div>
          ) : (
            availableFields.map((availableField) => (
              <Button
                key={availableField}
                onClick={() => addField(availableField)}
                variant="ghost"
                className="w-full flex items-center gap-2.5 px-3 rounded-xl hover:bg-primary/10 text-xs font-semibold text-start text-foreground transition-all group cursor-pointer justify-start"
                type="button"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-transform shrink-0" />
                <span className="min-w-0 truncate">{resolveFieldLabel(availableField)}</span>
              </Button>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
            {t("reports.builder.aggregatorFunction")}
          </label>
          <FormSelect
            value={aggregate}
            onChange={(value) => setAggregate(value as AggregateFn)}
            options={AGGREGATE_FNS.map((aggregateName) => {
              let label: string = aggregateName;
              if (aggregateName === "None") label = t("reports.builder.noGrouping");
              else if (aggregateName === "Sum") label = t("reports.visualizer.opSum");
              else if (aggregateName === "Average") label = t("reports.visualizer.opAvg");
              else if (aggregateName === "Count") label = t("reports.visualizer.opCount");
              else if (aggregateName === "Max") label = t("reports.visualizer.opMax");
              else if (aggregateName === "Min") label = t("reports.visualizer.opMin");
              return { value: aggregateName, label };
            })}
            className="w-full"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
            {t("reports.builder.groupCategory")}
          </label>
          <FormSelect
            value={groupBy}
            disabled={aggregate === "None"}
            onChange={(value) => setGroupBy(value)}
            options={[
              { value: "", label: t("reports.builder.noGrouping") },
              ...selectedFields.map((selectedField) => ({
                value: selectedField,
                label: resolveFieldLabel(selectedField),
              })),
            ]}
            className="w-full text-xs font-semibold rounded-xl border border-border bg-card/50 px-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-start">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
            {t("reports.builder.docAlignment")}
          </label>
          <div className="flex gap-1 p-1 bg-muted/30 border border-border/50 rounded-xl">
            <Button
              onClick={() => setOrientation("p")}
              variant={orientation === "p" ? "default" : "ghost"}
              className={`flex-1 min-h-11 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${orientation === "p" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
              type="button"
            >
              {t("reports.builder.portrait")}
            </Button>
            <Button
              onClick={() => setOrientation("l")}
              variant={orientation === "l" ? "default" : "ghost"}
              className={`flex-1 min-h-11 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${orientation === "l" ? "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground" : "text-sidebar-muted-foreground hover:text-foreground hover:bg-muted"}`}
              type="button"
            >
              {t("reports.builder.landscape")}
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block ms-1">
            {t("reports.builder.exportLayoutFormat")}
          </label>
          <FormSelect
            value={pageSize}
            onChange={(value) => setPageSize(value)}
            options={[
              { value: "a4", label: t("reports.builder.formatA4") },
              { value: "letter", label: t("reports.builder.formatLetter") },
              { value: "a3", label: t("reports.builder.formatA3") },
              { value: "legal", label: t("reports.builder.formatLegal") },
            ]}
            className="w-full animate-none"
          />
        </div>
      </div>
    </div>
  );
}
