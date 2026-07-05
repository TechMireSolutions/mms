import React, { useState } from "react";
import { Calendar, DollarSign } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_INPUT, FORM_TEXTAREA, FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { notify } from "@/lib/notify";
import { Session } from '@/lib/data/sessionsData';
import { toTitleCase, AppTranslationKey } from "@mms/shared";

interface SessionFormProps {
  open?: boolean;
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void;
}

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
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {sessionDraft.name}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px]">
          {sessionDraft.type}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] border capitalize ${
          sessionDraft.status === 'active' 
            ? 'bg-success/10 text-success border-success/20' 
            : sessionDraft.status === 'completed'
            ? 'bg-info/10 text-info border-info/20'
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {sessionDraft.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      Session Name is required
    </span>
  );

  const renderBasic = () => (
    <div className="space-y-4 text-left">
      <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <Calendar className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Session Details</h3>
        </div>

        <Field label="Session Name" required error={errors.name}>
          <div className="relative flex items-center group/input">
            <Calendar className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              value={sessionDraft.name || ""}
              onChange={(event) => updateDraft({ name: event.target.value })}
              placeholder="e.g. Hifz Morning Session 2026"
              className={`${FORM_INPUT} pl-10`}
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Session Type">
            <select
              className={FORM_SELECT}
              value={sessionDraft.type || "Hifz"}
              onChange={(event) => updateDraft({ type: event.target.value })}
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
              onChange={(event) => updateDraft({ status: event.target.value })}
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
            onChange={(event) => updateDraft({ description: event.target.value })}
            placeholder="Describe session details, schedule, requirements..."
            className={`${FORM_TEXTAREA} min-h-[80px]`}
          />
        </Field>
      </section>
    </div>
  );

  const renderFinancial = () => (
    <div className="space-y-4 text-left">
      <section className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40">
          <DollarSign className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Financial Settings</h3>
        </div>

        <Field label="Base Fee">
          <div className="relative flex items-center group/input">
            <DollarSign className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
            <Input
              type="number"
              value={sessionDraft.baseFee ?? 0}
              onChange={(event) => updateDraft({ baseFee: Number(event.target.value) })}
              className={`${FORM_INPUT} pl-10`}
            />
          </div>
        </Field>

        <Field label="Currency">
          <select
            className={FORM_SELECT}
            value={sessionDraft.currency || "PKR"}
            onChange={(event) => updateDraft({ currency: event.target.value })}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>{currency}</option>
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
      lang={language}
      cancelLabel="Cancel"
      saveLabel={session ? "Update" : "Create Session"}
      onSave={handleSave}
      saving={saving}
      saveDisabled={!sessionDraft.name?.trim() || !sessionDraft.startDate || !sessionDraft.endDate}
      footerStart={footerStart}
    >
      <div className="space-y-4">
        {renderBasic()}
        {renderFinancial()}
      </div>
    </FormModal>
  );
}
