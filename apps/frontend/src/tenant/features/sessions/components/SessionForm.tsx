import React, { useEffect, useMemo, useState } from "react";
import { Calendar, DollarSign } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { notify } from "@/lib/notify";
import { Session, SESSION_TYPES } from "@/lib/data/sessionsData";
import { toTitleCase, AppTranslationKey, todayISO, DEFAULT_CURRENCIES } from "@mms/shared";

interface SessionFormProps {
  open?: boolean;
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void | Promise<void>;
}

const SESSION_STATUSES = ["active", "upcoming", "completed", "cancelled"];
const CURRENCIES = DEFAULT_CURRENCIES.map((currency) => currency.code);
const SESSION_TYPE_LABEL_KEYS: Record<string, AppTranslationKey> = {
  Hifz: "sessions.types.hifz",
  Qaidah: "sessions.types.qaidah",
  Tajweed: "sessions.types.tajweed",
  "Islamic Studies": "sessions.types.islamicStudies",
  Arabic: "sessions.types.arabic",
  Other: "sessions.types.other",
};

export function SessionForm({
  open = true,
  session,
  onClose,
  onSave,
}: SessionFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { settings, types, statuses } = useSessionConfig();
  const { activeCurrency } = useFinanceCurrency();
  const defaultCurrency = activeCurrency.code;

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];
  const statusOptions = statuses.length > 0 ? statuses : [...SESSION_STATUSES];
  const defaultType = typeOptions.includes(settings.defaultSessionType)
    ? settings.defaultSessionType
    : (typeOptions[0] || "Hifz");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [sessionDraft, setSessionDraft] = useState<Partial<Session>>(() => ({
    name: session?.name ?? "",
    type: session?.type ?? defaultType,
    status: session?.status ?? "active",
    startDate: session?.startDate ?? todayISO(),
    endDate: session?.endDate ?? "",
    baseFee: session?.baseFee ?? 0,
    currency: session?.currency ?? defaultCurrency,
    description: session?.description ?? "",
    classes: session?.classes ?? [],
    timetable: session?.timetable ?? [],
    discounts: session?.discounts ?? [],
    budget: session?.budget ?? { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
    events: session?.events ?? [],
    tabarruk: session?.tabarruk ?? [],
  }));

  useEffect(() => {
    setSessionDraft({
      name: session?.name ?? "",
      type: session?.type ?? defaultType,
      status: session?.status ?? "active",
      startDate: session?.startDate ?? todayISO(),
      endDate: session?.endDate ?? "",
      baseFee: session?.baseFee ?? 0,
      currency: session?.currency ?? defaultCurrency,
      description: session?.description ?? "",
      classes: session?.classes ?? [],
      timetable: session?.timetable ?? [],
      discounts: session?.discounts ?? [],
      budget: session?.budget ?? { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
      events: session?.events ?? [],
      tabarruk: session?.tabarruk ?? [],
    });
    setErrors({});
  }, [session, defaultCurrency, defaultType]);

  const updateDraft = (patch: Partial<Session>) => {
    setSessionDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!sessionDraft.name?.trim()) {
      newErrors.name = t("sessions.form.nameRequired");
    }
    if (!sessionDraft.startDate) {
      newErrors.startDate = t("sessions.form.startDateRequired");
    }
    if (!sessionDraft.endDate) {
      newErrors.endDate = t("sessions.form.endDateRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t("contacts.form.pleaseFixErrors"));
      return;
    }

    setSaving(true);
    try {
      const name = toTitleCase(sessionDraft.name?.trim() || "");
      const saved = {
        ...sessionDraft,
        id: session?.id ?? `sess-${Date.now()}`,
        name,
        baseFee: Number(sessionDraft.baseFee) || 0,
        _blueprintId: "1.0",
      } as Session;

      await onSave(saved);
      onClose();
    } catch (err: unknown) {
      notify.error(t("sessions.toast.saveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = useMemo(() => {
    const status = sessionDraft.status || "active";
    const translationKey = `sessions.status.${status}` as AppTranslationKey;
    const translated = t(translationKey);
    return translated === translationKey ? toTitleCase(status) : translated;
  }, [sessionDraft.status, t]);

  const sessionTypeOptions = useMemo(
    () =>
      typeOptions.map((sessionType) => {
        const translationKey = SESSION_TYPE_LABEL_KEYS[sessionType];
        return {
          value: sessionType,
          label: translationKey ? t(translationKey) : sessionType,
        };
      }),
    [typeOptions, t],
  );

  const footerStart = sessionDraft.name ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {sessionDraft.name}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
          {sessionDraft.type}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs border capitalize ${
          sessionDraft.status === "active"
            ? "bg-success/10 text-success border-success/20"
            : sessionDraft.status === "completed"
            ? "bg-info/10 text-info border-info/20"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          {statusLabel}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {t("sessions.form.nameRequired")}
    </span>
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={session ? t("sessions.form.editTitle") : t("sessions.form.addTitle")}
      subtitle={t("sessions.form.subtitle")}
      icon={Calendar}
      lang={language}
      cancelLabel={t("common.cancel")}
      saveLabel={session ? t("sessions.action.update") : t("sessions.action.create")}
      onSave={() => { void handleSave(); }}
      saving={saving}
      saveDisabled={!sessionDraft.name?.trim() || !sessionDraft.startDate || !sessionDraft.endDate}
      footerStart={footerStart}
    >
      <div className="space-y-4">
        <div className="space-y-4 text-start">
          <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm text-start">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
              <Calendar className="w-4 h-4 text-primary/70 transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("sessions.form.sectionDetails")}</h3>
            </div>

            <Field label={t("sessions.form.name")} required error={errors.name}>
              <div className="relative flex items-center group/input">
                <Calendar className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  value={sessionDraft.name || ""}
                  onChange={(event) => updateDraft({ name: event.target.value })}
                  placeholder={t("sessions.form.namePlaceholder")}
                  className={`${FORM_INPUT} ps-10`}
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("sessions.form.type")}>
                <FormSelect
                  value={sessionDraft.type || defaultType}
                  onChange={(val) => updateDraft({ type: val })}
                  options={sessionTypeOptions}
                />
              </Field>

              <Field label={t("sessions.form.status")}>
                <FormSelect
                  value={sessionDraft.status || "active"}
                  onChange={(val) => updateDraft({ status: val })}
                  options={statusOptions.map((statusOption) => {
                    const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
                    const translated = t(translationKey);
                    const label = translated === translationKey ? toTitleCase(statusOption) : translated;
                    return { value: statusOption, label };
                  })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={t("sessions.form.startDate")} required error={errors.startDate}>
                <DatePicker
                  value={sessionDraft.startDate || undefined}
                  onChange={(dateStr) => updateDraft({ startDate: dateStr })}
                />
              </Field>

              <Field label={t("sessions.form.endDate")} required error={errors.endDate}>
                <DatePicker
                  value={sessionDraft.endDate || undefined}
                  onChange={(dateStr) => updateDraft({ endDate: dateStr })}
                />
              </Field>
            </div>

            <Field label={t("sessions.form.description")}>
              <Textarea
                value={sessionDraft.description || ""}
                onChange={(event) => updateDraft({ description: event.target.value })}
                placeholder={t("sessions.form.descriptionPlaceholder")}
                className="min-h-[5rem]"
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-4 text-start">
          <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm text-start">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
              <DollarSign className="w-4 h-4 text-primary/70 transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("sessions.form.sectionFinancial")}</h3>
            </div>

            <Field label={t("sessions.form.baseFee")}>
              <div className="relative flex items-center group/input">
                <DollarSign className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  type="number"
                  value={sessionDraft.baseFee ?? 0}
                  onChange={(event) => updateDraft({ baseFee: Number(event.target.value) })}
                  className={`${FORM_INPUT} ps-10`}
                />
              </div>
            </Field>

            <Field label={t("sessions.form.currency")}>
              <FormSelect
                value={sessionDraft.currency || defaultCurrency}
                onChange={(val) => updateDraft({ currency: val })}
                options={CURRENCIES}
              />
            </Field>
          </Card>
        </div>
      </div>
    </FormModal>
  );
}
