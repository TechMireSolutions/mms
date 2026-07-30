import React, { useState } from "react";
import { Clock } from "lucide-react";
import { DAYS, ACTIVITY_TYPES, type TimetableItem } from '@/lib/data/sessionsData';
import { FormModal } from "@/components/ui/FormModal";
import { RequiredMark } from "@/components/ui/FormPrimitives";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import type { AppTranslationKey } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { TIMETABLE_EMPTY_DRAFT } from "@/tenant/features/sessions/components/tabs/timetableTabConfig";

interface TimetableAddActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (entry: TimetableItem) => void | Promise<void>;
  saving: boolean;
}

export function TimetableAddActivityModal({ open, onClose, onSave, saving }: TimetableAddActivityModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activityDraft, setActivityDraft] = useState<Partial<TimetableItem>>({ ...TIMETABLE_EMPTY_DRAFT });
  const updateActivityDraft = <K extends keyof TimetableItem>(field: K, value: TimetableItem[K]) => setActivityDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

  React.useEffect(() => {
    if (open) {
      setActivityDraft({ ...TIMETABLE_EMPTY_DRAFT });
    }
  }, [open]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("sessions.timetable.add")}
      icon={Clock}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.add")}
      onSave={() => onSave({ ...activityDraft, id: `tt${Date.now()}` } as TimetableItem)}
      saving={saving}
      saveDisabled={!activityDraft.activity}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="activity-name">{t("sessions.timetable.form.name")}<RequiredMark /></label>
          <Input id="activity-name" value={activityDraft.activity || ""} onChange={(event) => updateActivityDraft("activity", event.target.value)} placeholder={t("sessions.timetable.form.namePlaceholder")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-day">{t("sessions.timetable.form.day")}</label>
            <FormSelect
              id="activity-day"
              value={activityDraft.day || "Mon"}
              onChange={(value) => updateActivityDraft("day", value as TimetableItem["day"])}
              options={DAYS.map((day) => ({ value: day, label: t(`sessions.timetable.day.${day}` as AppTranslationKey) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-type">{t("sessions.timetable.form.type")}</label>
            <FormSelect
              id="activity-type"
              value={activityDraft.type || "class"}
              onChange={(value) => updateActivityDraft("type", value as TimetableItem["type"])}
              options={ACTIVITY_TYPES.map((activityType) => ({ value: activityType, label: t(`sessions.timetable.type.${activityType}` as AppTranslationKey) }))}
              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={FORM_LABEL} htmlFor="activity-start">{t("sessions.timetable.form.startTime")}</label>
            <Input id="activity-start" type="time" value={activityDraft.startTime || ""} onChange={(event) => updateActivityDraft("startTime", event.target.value)} required />
          </div>
          <div>
            <label className={FORM_LABEL} htmlFor="activity-end">{t("sessions.timetable.form.endTime")}</label>
            <Input id="activity-end" type="time" value={activityDraft.endTime || ""} onChange={(event) => updateActivityDraft("endTime", event.target.value)} required />
          </div>
        </div>
        <div>
          <label className={FORM_LABEL} htmlFor="activity-location">{t("sessions.timetable.form.location")}</label>
          <Input id="activity-location" value={activityDraft.location || ""} onChange={(event) => updateActivityDraft("location", event.target.value)} placeholder={t("sessions.timetable.form.locationPlaceholder")} />
        </div>
      </div>
    </FormModal>
  );
}
