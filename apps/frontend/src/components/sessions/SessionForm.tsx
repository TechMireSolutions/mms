import React, { useState, useMemo } from "react";
import { Calendar, DollarSign, BookOpen } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "../ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { notify } from "@/lib/notify";
import { Session } from '@/lib/data/sessionsData';
import { toTitleCase, AppTranslationKey } from "@mms/shared";

interface SessionFormProps {
  open?: boolean;
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void;
}

const SESSION_TABS = [
  { key: "basic", label: "Basic Info", icon: Calendar },
  { key: "financial", label: "Financials", icon: DollarSign },
] as const;

type TabKey = (typeof SESSION_TABS)[number]["key"];

const SESSION_TYPES = ["Hifz", "Qaidah", "Tajweed", "Islamic Studies", "Arabic", "Other"];
const SESSION_STATUSES = ["active", "upcoming", "completed", "cancelled"];
const CURRENCIES = ["PKR", "USD", "GBP", "AED", "SAR"];

export function SessionForm({
  open = true,
  session,
  onClose,
  onSave,
}: SessionFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();

  const [tab, setTab] = useState<TabKey>("basic");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [sessionDraft, setSessionDraft] = useState<Partial<Session>>(() => ({
    name: session?.name ?? "",
    type: session?.type ?? "Hifz",
    status: session?.status ?? "active",
    startDate: session?.startDate ?? new Date().toISOString().split("T")[0],
    endDate: session?.endDate ?? "",
    baseFee: session?.baseFee ?? 0,
    currency: session?.currency ?? "PKR",
    description: session?.description ?? "",
    classes: session?.classes ?? [],
    timetable: session?.timetable ?? [],
    discounts: session?.discounts ?? [],
    budget: session?.budget ?? { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
    events: session?.events ?? [],
    tabarruk: session?.tabarruk ?? [],
  }));

  const updateDraft = (patch: Partial<Session>) => {
    setSessionDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!sessionDraft.name?.trim()) {
      newErrors.name = "Session name is required";
    }
    if (!sessionDraft.startDate) {
      newErrors.startDate = "Start Date is required";
    }
    if (!sessionDraft.endDate) {
      newErrors.endDate = "End Date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTab("basic");
      notify.error("Please fix form validation errors");
      return;
    }

    setSaving(true);
    try {
      const name = toTitleCase(sessionDraft.name?.trim() || "") as string;
      const saved: Session = {
        ...sessionDraft,
        id: session?.id || `s${Date.now()}`,
        name,
        baseFee: Number(sessionDraft.baseFee) || 0,
        _blueprintId: "1.0",
      } as Session;

      onSave(saved);
      notify.success(session ? "Session updated successfully" : "Session created successfully");
      onClose();
    } catch (err: any) {
      notify.error(t("settings.serverSaveFailed") || "Failed to save", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const footerStart = sessionDraft.name ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{sessionDraft.name}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>{sessionDraft.type}</span>
        <span className="border-s border-border ps-2 capitalize">{sessionDraft.status}</span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">Session Name is required</span>
  );

  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
        <Field label="Session Name" required error={errors.name}>
          <Input
            value={sessionDraft.name || ""}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="e.g. Hifz Morning Session 2026"
            className={FORM_INPUT}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Session Type">
            <select
              className={FORM_SELECT}
              value={sessionDraft.type || "Hifz"}
              onChange={(e) => updateDraft({ type: e.target.value })}
            >
              {SESSION_TYPES.map((tOpt) => (
                <option key={tOpt} value={tOpt}>{tOpt}</option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className={FORM_SELECT}
              value={sessionDraft.status || "active"}
              onChange={(e) => updateDraft({ status: e.target.value })}
            >
              {SESSION_STATUSES.map((statusOption) => {
                const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
                const translated = t(translationKey);
                const label = translated === translationKey ? statusOption.charAt(0).toUpperCase() + statusOption.slice(1) : translated;
                return (
                  <option key={statusOption} value={statusOption}>{label}</option>
                );
              })}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date" required error={errors.startDate}>
            <DatePicker
              value={sessionDraft.startDate || undefined}
              onChange={(dateStr) => updateDraft({ startDate: dateStr })}
            />
          </Field>

          <Field label="End Date" required error={errors.endDate}>
            <DatePicker
              value={sessionDraft.endDate || undefined}
              onChange={(dateStr) => updateDraft({ endDate: dateStr })}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={sessionDraft.description || ""}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="Describe session details, schedule, requirements..."
            className="w-full min-h-[80px] p-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all resize-y"
          />
        </Field>
      </section>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-4 text-left">
      <section className="rounded-xl border border-border bg-card/40 p-5 space-y-4 shadow-sm">
        <Field label="Base Fee">
          <Input
            type="number"
            value={sessionDraft.baseFee ?? 0}
            onChange={(e) => updateDraft({ baseFee: Number(e.target.value) })}
            className={FORM_INPUT}
          />
        </Field>

        <Field label="Currency">
          <select
            className={FORM_SELECT}
            value={sessionDraft.currency || "PKR"}
            onChange={(e) => updateDraft({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
      </section>
    </div>
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={session ? "Edit Session" : "New Session"}
      subtitle="Fill in the session details below"
      icon={Calendar}
      tall
      tabs={SESSION_TABS}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="session-form-tab"
      lang={language}
      cancelLabel="Cancel"
      saveLabel={session ? "Update" : "Create Session"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!sessionDraft.name?.trim() || !sessionDraft.startDate || !sessionDraft.endDate}
      footerStart={footerStart}
    >
      {tab === "basic" ? renderBasic() : renderFinancial()}
    </FormModal>
  );
}
