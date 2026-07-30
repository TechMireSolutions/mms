import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { notify } from "@/lib/notify";
import { Session, SESSION_TYPES } from "@/lib/data/sessionsData";
import { toTitleCase, AppTranslationKey, todayISO, DEFAULT_CURRENCIES } from "@mms/shared";
import {
  SessionDetailsSection,
  SessionFinancialSection,
  type SessionSelectOption,
} from "@/tenant/features/sessions/components/SessionFormSections";

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
  const statusValues = statuses.length > 0 ? statuses : [...SESSION_STATUSES];
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

  const statusOptions = useMemo<SessionSelectOption[]>(
    () =>
      statusValues.map((statusOption) => {
        const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
        const translated = t(translationKey);
        const label = translated === translationKey ? toTitleCase(statusOption) : translated;
        return { value: statusOption, label };
      }),
    [statusValues, t],
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
        <SessionDetailsSection
          sessionDraft={sessionDraft}
          errors={errors}
          defaultType={defaultType}
          sessionTypeOptions={sessionTypeOptions}
          statusOptions={statusOptions}
          onDraftChange={updateDraft}
        />
        <SessionFinancialSection
          sessionDraft={sessionDraft}
          errors={errors}
          currencyOptions={CURRENCIES}
          defaultCurrency={defaultCurrency}
          onDraftChange={updateDraft}
        />
      </div>
    </FormModal>
  );
}
