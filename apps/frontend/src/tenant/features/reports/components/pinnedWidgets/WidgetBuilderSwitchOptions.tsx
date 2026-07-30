import React from "react";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { COLLECTION_OPTIONS, getCollectionLabel } from "@/tenant/features/reports/components/reportMetadata";
import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";

export interface SwitchRecordOption {
  id: string;
  label: string;
}

interface WidgetBuilderSwitchOptionsProps {
  switchActionType: "app_setting" | "db_record";
  setSwitchActionType: (switchActionType: "app_setting" | "db_record") => void;
  switchStateKey: string;
  setSwitchStateKey: (switchStateKey: string) => void;
  switchCollection: CustomWidget["collection"];
  setSwitchCollection: (switchCollection: CustomWidget["collection"]) => void;
  switchRecordId: string;
  setSwitchRecordId: (switchRecordId: string) => void;
  switchLabelOn: string;
  setSwitchLabelOn: (switchLabelOn: string) => void;
  switchLabelOff: string;
  setSwitchLabelOff: (switchLabelOff: string) => void;
  dbRecordsList: SwitchRecordOption[];
}

export function WidgetBuilderSwitchOptions({
  switchActionType,
  setSwitchActionType,
  switchStateKey,
  setSwitchStateKey,
  switchCollection,
  setSwitchCollection,
  switchRecordId,
  setSwitchRecordId,
  switchLabelOn,
  setSwitchLabelOn,
  switchLabelOff,
  setSwitchLabelOff,
  dbRecordsList,
}: WidgetBuilderSwitchOptionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-1">
        <label className={FORM_LABEL}>{t("reports.widgets.builder.switchTarget")}</label>
        <FormSelect
          value={switchActionType}
          onChange={(val) => setSwitchActionType(val as "app_setting" | "db_record")}
          options={[
            { value: "app_setting", label: t("reports.widgets.builder.switchTargetApp") },
            { value: "db_record", label: t("reports.widgets.builder.switchTargetDb") },
          ]}
        />
      </div>

      {switchActionType === "app_setting" ? (
        <div className="space-y-1">
          <label className={FORM_LABEL}>{t("reports.widgets.builder.selectParameter")}</label>
          <FormSelect
            value={switchStateKey}
            onChange={setSwitchStateKey}
            options={[
              { value: "section_enrollmentChart", label: t("reports.widgets.builder.paramEnrollmentChart") },
              { value: "section_revenueChart", label: t("reports.widgets.builder.paramRevenueChart") },
              { value: "section_attendanceChart", label: t("reports.widgets.builder.paramAttendanceChart") },
              { value: "section_hasanatChart", label: t("reports.widgets.builder.paramHasanatChart") },
              { value: "section_sessionsTable", label: t("reports.widgets.builder.paramSessionsTable") },
              { value: "app_setting_attendance_lock", label: t("reports.widgets.builder.paramAttendanceLock") },
              { value: "app_setting_mute_notifications", label: t("reports.widgets.builder.paramMuteNotifications") },
            ]}
          />
        </div>
      ) : (
        <>
          <div className="space-y-1">
            <label className={FORM_LABEL}>{t("reports.widgets.builder.recordCollection")}</label>
            <FormSelect
              value={switchCollection}
              onChange={(val) => {
                setSwitchCollection(val as CustomWidget["collection"]);
                setSwitchRecordId("");
              }}
              options={COLLECTION_OPTIONS.map((collectionOption) => ({
                value: collectionOption.value,
                label: getCollectionLabel(collectionOption.value, collectionOption.label, t),
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className={FORM_LABEL}>{t("reports.widgets.builder.selectRecord")}</label>
            <FormSelect
              value={switchRecordId}
              onChange={setSwitchRecordId}
              options={
                dbRecordsList.length === 0
                  ? [{ value: "", label: t("reports.widgets.builder.noRecordsLoaded") }]
                  : dbRecordsList.map((rec) => ({ value: rec.id, label: rec.label }))
              }
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOn")}</label>
          <Input
            type="text"
            value={switchLabelOn}
            onChange={(event) => setSwitchLabelOn(event.target.value)}
            placeholder={t("reports.widgets.builder.placeholderActive")}
            className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-11"
          />
        </div>
        <div className="space-y-1">
          <label className={FORM_LABEL}>{t("reports.widgets.builder.labelOff")}</label>
          <Input
            type="text"
            value={switchLabelOff}
            onChange={(event) => setSwitchLabelOff(event.target.value)}
            placeholder={t("reports.widgets.builder.placeholderInactive")}
            className="bg-card/40 backdrop-blur-md font-semibold text-xs py-1.5 min-h-11"
          />
        </div>
      </div>
    </>
  );
}
