import React, { useState, useMemo, useCallback, useTransition } from "react";
import { z } from "zod";
import { Calendar, DollarSign, BookOpen } from "lucide-react";
import { MmsDynamicForm } from "@/components/ui/MmsDynamicForm";
import { useMmsForm } from "@/hooks/useMmsForm";
import { useSessionConfig } from "@/hooks/useSessionConfig";
import { SessionsSettings } from "./SessionsSettings";
import { SESSION_TYPES, Session } from '@/lib/data/sessionsData';
import { useTranslation } from "@/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import {
  toTitleCase,
  type AppTranslationKey,
  type FieldDefinition,
  type TabDefinition,
  buildCustomFieldSchema,
  SESSIONS_TAB_REGISTRY,
  INITIAL_SESSIONS_FIELD_SEED,
  SESSIONS_MODULE_CONTRACT,
  isRtlLanguage,
} from "@mms/shared";

interface SessionFormProps {
  open?: boolean;
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void;
}

const ICON_MAP: Record<string, typeof Calendar> = {
  basic: Calendar,
  financial: DollarSign,
};

export function SessionForm({ open = true, session, onClose, onSave }: SessionFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { can } = usePermissions();
  const canEditSetup = can(SESSIONS_MODULE_CONTRACT.permissions.setupWrite);
  const queryClient = useQueryClient();
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [, startTransition] = useTransition();

  const { settings, statuses, types, customFields } = useSessionConfig();
  const statusOptions = statuses.length > 0 ? statuses : ["active", "upcoming", "completed", "cancelled"];
  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];

  // Construct fields mapped by tabs
  const fieldsByTab = useMemo<Record<string, FieldDefinition[]>>(() => {
    const rawFields = settings.fields || {};
    const hasTabbedFields = Object.values(rawFields).some((fieldGroup) => Array.isArray(fieldGroup));
    
    const base = hasTabbedFields
      ? (rawFields as Record<string, FieldDefinition[]>)
      : INITIAL_SESSIONS_FIELD_SEED;

    const mapped: Record<string, FieldDefinition[]> = {};

    Object.entries(base).forEach(([tabId, tabFields]) => {
      mapped[tabId] = tabFields.map((field) => {
        if (field.key === "type") {
          return { ...field, options: typeOptions };
        }
        if (field.key === "status") {
          return { ...field, options: statusOptions };
        }
        if (field.key === "currency") {
          return { ...field, options: ["PKR", "USD", "GBP", "AED", "SAR"] };
        }
        return field;
      });
    });

    // If it was the flat setup, append custom fields to basic tab
    if (!hasTabbedFields && customFields && customFields.length > 0) {
      const basicFields = [...(mapped.basic || [])];
      const fieldOrder = settings.fieldOrder || [];
      customFields.forEach((customField) => {
        if (!basicFields.some((field) => field.key === customField.id)) {
          const orderIdx = fieldOrder.indexOf(customField.id);
          basicFields.push({
            key: customField.id,
            label: customField.label,
            type: customField.type as any,
            required: !!customField.required,
            enabled: true,
            order: orderIdx >= 0 ? orderIdx : 99,
            placeholder: customField.placeholder,
            options: customField.options,
          });
        }
      });
      mapped.basic = basicFields.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    }

    return mapped;
  }, [settings.fields, settings.fieldOrder, customFields, typeOptions, statusOptions]);

  // Construct initial values conforming to Rule 15.1
  const initialValues = useMemo<Partial<Session>>(() => {
    const initial: Record<string, any> = {
      name: "",
      type: typeOptions[0] || "Hifz",
      status: statusOptions[0] || "active",
      startDate: null,
      endDate: null,
      baseFee: null,
      currency: "PKR",
      description: "",
      classes: [],
      timetable: [],
      discounts: [],
      budget: { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
      events: [],
      tabarruk: [],
    };

    const draft = queryClient.getQueryData<Partial<Session>>(['builder_draft', 'session', session?.id || 'new']);
    const target = draft || session || {};
    
    return {
      ...initial,
      ...target,
    } as Partial<Session>;
  }, [session, queryClient, typeOptions, statusOptions]);

  // Setup Zod Validation Schema
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {
      id: z.string().optional(),
      classes: z.array(z.any()).default([]),
      timetable: z.array(z.any()).default([]),
      discounts: z.array(z.any()).default([]),
      budget: z.any().optional(),
      events: z.array(z.any()).default([]),
      tabarruk: z.array(z.any()).default([]),
      _blueprintId: z.string().optional(),
    };

    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "financial"]);

    Object.keys(fieldsByTab).forEach((tabId) => {
      if (tabId !== "basic" && !enabledTabIds.has(tabId)) {
        return;
      }

      const tabFields = fieldsByTab[tabId] || [];
      tabFields.forEach((field) => {
        if (!field.enabled) return;
        shape[field.key] = buildCustomFieldSchema(field);
      });
    });

    return z.object(shape).passthrough();
  }, [fieldsByTab, settings.enabledTabs]);

  const {
    form,
    tab,
    setTab,
    saving,
    errors,
    handleSave,
  } = useMmsForm<Session>({
    schema,
    fields: fieldsByTab,
    initialData: initialValues,
    t,
  });

  const sessionDraft = form.watch();
  const setValue = form.setValue;

  const handleToggleBuilderMode = useCallback((active: boolean) => {
    if (active) {
      queryClient.setQueryData(['builder_draft', 'session', session?.id || 'new'], form.getValues());
    }
    startTransition(() => {
      setIsBuilderMode(active);
    });
  }, [queryClient, session?.id, form]);

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "financial"]);

    Object.keys(fieldsByTab).forEach((tabId) => {
      if (tabId !== "basic" && !enabledTabIds.has(tabId)) {
        return;
      }

      const tabFields = fieldsByTab[tabId] || [];
      tabFields.forEach((field) => {
        if (!field.enabled) return;
        
        // Skip booleans and ai_summary fields from completeness score
        if (field.type === "boolean" || field.type === "ai_summary") {
          return;
        }

        const isRequired = !!field.required;
        const fieldValue = (sessionDraft as Record<string, any>)[field.key];
        const isFilled = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

        if (isRequired) {
          totalRequired++;
          if (isFilled) filledRequired++;
        } else {
          totalOptional++;
          if (isFilled) filledOptional++;
        }
      });
    });

    const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (reqRatio * 0.7) + (optRatio * 0.3);

    return Math.round(progress * 100);
  }, [sessionDraft, fieldsByTab, settings.enabledTabs]);

  const visibleTabs = useMemo(() => {
    const tabsFromConfig = (settings.formTabs && settings.formTabs.length > 0 
      ? settings.formTabs 
      : SESSIONS_TAB_REGISTRY) as TabDefinition[];
    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "financial"]);

    return [...tabsFromConfig]
      .sort((a, b) => a.order - b.order)
      .filter((tabDef) => {
        if (tabDef.key === "basic") return true;
        if (!enabledTabIds.has(tabDef.key)) return false;
        
        // Ghost Tab Prevention
        const tabFields = fieldsByTab[tabDef.key] || [];
        const hasVisibleFields = tabFields.some((field) => field.enabled);
        if (!hasVisibleFields) return false;

        return true;
      });
  }, [settings.formTabs, settings.enabledTabs, fieldsByTab]);

  const formTabs = useMemo(() => {
    return visibleTabs.map((visibleTab) => ({
      key: visibleTab.key,
      label: visibleTab.label,
      icon: ICON_MAP[visibleTab.key] || BookOpen,
    }));
  }, [visibleTabs]);

  const prepareSessionData = useCallback((formData: Session): Session => {
    const name = toTitleCase(formData.name?.trim() || "") as string;
    
    return {
      ...formData,
      id: session?.id || formData.id || `s${Date.now()}`,
      name: name || "Untitled Session",
      type: formData.type || typeOptions[0] || "Hifz",
      status: formData.status || statusOptions[0] || "active",
      startDate: formData.startDate || "",
      endDate: formData.endDate || "",
      baseFee: Number(formData.baseFee) || 0,
      currency: formData.currency || "PKR",
      classes: session?.classes || [],
      timetable: session?.timetable || [],
      discounts: session?.discounts || [],
      budget: session?.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
      events: session?.events || [],
      tabarruk: session?.tabarruk || [],
      _blueprintId: "1.0",
    } as Session;
  }, [session, typeOptions, statusOptions]);

  const onSubmit = useCallback(async (formData: Session) => {
    const sessionToSave = prepareSessionData(formData);
    onSave(sessionToSave);
  }, [prepareSessionData, onSave]);

  const renderField = useCallback((field: FieldDefinition) => {
    if (field.key === "status") {
      const fieldError = errors.find((error) => error.fieldId === field.key);
      return (
        <div key="status">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            {field.label} {field.required ? "*" : ""}
          </label>
          <select
            id="sessionStatus"
            className={`w-full px-3 py-2 bg-card border rounded-lg text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary ${
              fieldError ? "border-destructive focus:ring-destructive" : "border-border focus:border-primary"
            }`}
            value={sessionDraft.status || "active"}
            onChange={(event) => setValue("status", event.target.value, { shouldValidate: true, shouldDirty: true })}
            required={field.required}
          >
            {statusOptions.map((statusOption) => {
              const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
              const translated = t(translationKey);
              const label = translated === translationKey ? statusOption.charAt(0).toUpperCase() + statusOption.slice(1) : translated;
              return (
                <option key={statusOption} value={statusOption}>{label}</option>
              );
            })}
          </select>
          {fieldError && <p className="text-[10px] font-medium text-destructive mt-1">{fieldError.message}</p>}
        </div>
      );
    }
    return null;
  }, [sessionDraft.status, statusOptions, t, errors, setValue]);

  const footerStart = sessionDraft.name ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{sessionDraft.name}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>{sessionDraft.type}</span>
        <span className="border-s border-border ps-2">{sessionDraft.status}</span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">Session Name is required</span>
  );

  return (
    <MmsDynamicForm
      open={open}
      onClose={onClose}
      title={session ? "Edit Session" : "New Session"}
      subtitle="Fill in the session details below"
      icon={Calendar}
      progress={completeness}
      progressLabel="Progress"
      showBuilderToggle={canEditSetup}
      isBuilderMode={isBuilderMode}
      onBuilderModeChange={handleToggleBuilderMode}
      tabs={formTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="session-form-tab"
      dir={isRtlLanguage(language) ? "rtl" : "ltr"}
      lang={language}
      error={errors.map((error) => error.message)}
      cancelLabel="Cancel"
      saveLabel={session ? "Update" : "Create Session"}
      onSave={() => void handleSave(onSubmit)()}
      saving={saving}
      saveDisabled={!sessionDraft.name?.trim() || !sessionDraft.startDate || !sessionDraft.endDate}
      footerStart={footerStart}
      fields={fieldsByTab[tab] || []}
      data={sessionDraft}
      setValue={(key, fieldValue, options) => setValue(key as any, fieldValue, options)}
      errors={errors}
      renderField={renderField}
      builderPanel={
        <SessionsSettings mode="fields" />
      }
    />
  );
}
