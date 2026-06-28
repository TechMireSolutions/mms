import React, { useMemo, useState, useTransition, useCallback, useEffect } from "react";
import { z } from "zod";
import { School } from "lucide-react";
import { MmsDynamicForm } from "@/components/ui/MmsDynamicForm";
import { useMmsForm } from "@/hooks/useMmsForm";
import { useTeacherConfig } from "@/hooks/useTeacherConfig";
import { TeachersSettings } from "./TeachersSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { useContactById } from "@/hooks/useContacts";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useTeacherLinkedContactIds, useTeacherNextEmployeeId } from "@/hooks/useTeachers";
import ContactPicker from "@/components/contactLink/ContactPicker";
import { Input } from "@/components/ui/input";
import { FORM_INPUT, FORM_SELECT } from "@/components/ui/formStyles";
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import {
  type Teacher,
  type AppTranslationKey,
  type FieldDefinition,
  type TabDefinition,
  buildCustomFieldSchema,
  getDefaultFieldValue,
  TEACHERS_TAB_REGISTRY,
  INITIAL_TEACHERS_FIELD_SEED,
  TEACHERS_MODULE_CONTRACT,
  TEACHER_STATUS_VALUES,
  TEACHER_SPECIALIZATION_VALUES,
  isRtlLanguage,
} from "@mms/shared";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (data: Teacher) => void;
}

interface TeacherFormData {
  contactId: string | number | null;
  employeeId?: string;
  specialization: string;
  status: string;
  joinDate: string | null;
  qualification?: string;
  notes?: string;
  [key: string]: unknown;
}

export function TeacherForm({
  teacher,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { can } = usePermissions();
  const canEditSetup = can(TEACHERS_MODULE_CONTRACT.permissions.setupWrite);
  const queryClient = useQueryClient();
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [, startTransition] = useTransition();

  const { settings, statuses, specializations } = useTeacherConfig();
  const statusOptions = statuses.length > 0 ? statuses : [...TEACHER_STATUS_VALUES];
  const specializationOptions = specializations.length > 0 ? specializations : [...TEACHER_SPECIALIZATION_VALUES];

  const autoGenerateId = settings.autoGenerateId && !teacher;
  const { data: linkedTeacherContactIds = [] } = useTeacherLinkedContactIds(
    teacher?.id ? String(teacher.id) : undefined,
  );
  const { data: nextEmployeeId } = useTeacherNextEmployeeId({
    prefix: settings.idPrefix,
    enabled: autoGenerateId,
  });

  const usedContactIds = linkedTeacherContactIds;

  // Construct fields mapped by tabs
  const fieldsByTab = useMemo<Record<string, FieldDefinition[]>>(() => {
    const rawFields = settings.fields || {};
    const hasTabbedFields = Object.values(rawFields).some(val => Array.isArray(val));
    
    const base = hasTabbedFields
      ? (rawFields as Record<string, FieldDefinition[]>)
      : INITIAL_TEACHERS_FIELD_SEED;

    const mapped: Record<string, FieldDefinition[]> = {};

    Object.entries(base).forEach(([tabId, list]) => {
      mapped[tabId] = list.map((f) => {
        if (f.key === "specialization") {
          return { ...f, options: specializationOptions };
        }
        return f;
      });
    });

    const customFields = settings.customFields || [];
    // If it was the flat setup, append custom fields to basic tab
    if (!hasTabbedFields && customFields.length > 0) {
      const basicFields = [...(mapped.basic || [])];
      const fieldOrder = settings.fieldOrder || [];
      customFields.forEach(cf => {
        if (!basicFields.some(f => f.key === cf.id)) {
          const orderIdx = fieldOrder.indexOf(cf.id);
          basicFields.push({
            key: cf.id,
            label: cf.label,
            type: (cf.type || "text") as any,
            required: !!cf.required,
            enabled: true,
            order: orderIdx >= 0 ? orderIdx : 99,
            placeholder: undefined,
            options: cf.options,
          });
        }
      });
      mapped.basic = basicFields.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    }

    return mapped;
  }, [settings.fields, settings.fieldOrder, settings.customFields, specializationOptions]);

  // Construct initial values conforming to Rule 15.1
  const initialValues = useMemo<TeacherFormData>(() => {
    const initial: TeacherFormData = {
      contactId: null,
      employeeId: "",
      specialization: settings.defaultSpecialization || specializationOptions[0] || "General",
      status: statusOptions[0] || "active",
      joinDate: null,
      qualification: "",
      notes: "",
    };

    const draft = queryClient.getQueryData<TeacherFormData>(['builder_draft', 'teacher', teacher?.id || 'new']);
    const target = draft || teacher || {};
    
    return {
      ...initial,
      ...target,
    } as TeacherFormData;
  }, [teacher, queryClient, settings.defaultSpecialization, specializationOptions, statusOptions]);

  // Setup Zod Validation Schema
  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {
      id: z.string().optional(),
      contactId: z.union([z.string(), z.number()]).refine(val => val !== undefined && val !== null && val !== "", {
        message: t('teachers.errorContactRequired'),
      }),
      employeeId: z.string().optional(),
      status: z.string().min(1, t('teachers.errorStatusRequired')),
      notes: z.string().optional().nullable(),
    };

    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "employment"]);

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
  }, [fieldsByTab, settings.enabledTabs, t]);

  const {
    form,
    tab,
    setTab,
    saving,
    errors,
    handleSave,
  } = useMmsForm<TeacherFormData>({
    schema,
    fields: fieldsByTab,
    initialData: initialValues,
    t,
  });

  const data = form.watch();
  const setValue = form.setValue;

  useEffect(() => {
    if (!autoGenerateId || !nextEmployeeId) return;
    if (!form.getValues('employeeId')) {
      setValue('employeeId', nextEmployeeId);
    }
  }, [autoGenerateId, nextEmployeeId, form, setValue]);

  const handleToggleBuilderMode = useCallback((active: boolean) => {
    if (active) {
      queryClient.setQueryData(['builder_draft', 'teacher', teacher?.id || 'new'], form.getValues());
    }
    startTransition(() => {
      setIsBuilderMode(active);
    });
  }, [queryClient, teacher?.id, form]);

  const { data: linkedContact } = useContactById(
    data.contactId != null ? String(data.contactId) : undefined,
    data.contactId != null,
  );

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    // Contact link is a core required field
    totalRequired++;
    if (data.contactId) filledRequired++;

    // Employee ID is a core required field if not auto-generated
    if (!autoGenerateId) {
      totalRequired++;
      if (data.employeeId) filledRequired++;
    }

    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "employment"]);

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
        const val = data[field.key];
        const isFilled = val !== undefined && val !== null && val !== "";

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
  }, [data, fieldsByTab, settings.enabledTabs, autoGenerateId]);

  const visibleTabs = useMemo(() => {
    const tabsFromConfig = (settings.formTabs && settings.formTabs.length > 0 
      ? settings.formTabs 
      : TEACHERS_TAB_REGISTRY) as TabDefinition[];
    const enabledTabIds = settings.enabledTabs && settings.enabledTabs.length > 0 
      ? new Set(settings.enabledTabs) 
      : new Set(["basic", "employment"]);

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
    return visibleTabs.map((t) => ({
      key: t.key,
      label: t.label,
    }));
  }, [visibleTabs]);

  const onSubmit = useCallback((formData: TeacherFormData) => {
    const id = teacher?.id ?? `tch${Date.now()}`;
    onSave({
      id,
      contactId: formData.contactId!,
      employeeId: formData.employeeId || (autoGenerateId ? nextEmployeeId : undefined),
      specialization: formData.specialization,
      status: formData.status,
      joinDate: formData.joinDate ?? undefined,
      qualification: formData.qualification || undefined,
      notes: formData.notes || undefined,
    } as unknown as Teacher);
    onClose();
  }, [teacher, autoGenerateId, nextEmployeeId, onSave, onClose]);

  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    const value = data[field.key] ?? getDefaultFieldValue(field);
    const fieldError = errors.find((e) => e.fieldId === field.key);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setValue(field.key as any, next, { shouldValidate: true, shouldDirty: true })}
            error={!!fieldError}
          />
        </Field>
      </div>
    );
  };

  const renderBasicContent = () => {
    if (tab === "basic") {
      const basicFields = (fieldsByTab.basic || []).filter((f) => f.enabled);
      return (
        <div className="space-y-5 text-left">
          {/* Contact Picker Section */}
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
            <div>
              <h3 className="text-xs font-bold text-foreground">{t('teachers.field.contact')}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t('teachers.form.contactHint')}</p>
            </div>
            <ContactPicker
              label={t('teachers.field.contact')}
              value={data.contactId}
              onChange={(id) => setValue("contactId", id)}
              excludeIds={usedContactIds}
              searchPlaceholder={t('teachers.form.searchContact')}
              emptyTitle={t('teachers.form.noContacts')}
              emptyHint={t('teachers.form.noContactsHint')}
              error={!!errors.find((e) => e.fieldId === "contactId")}
            />
            {errors.find((e) => e.fieldId === "contactId") && (
              <p className="text-[10px] text-destructive mt-1 font-medium">
                {errors.find((e) => e.fieldId === "contactId")?.message}
              </p>
            )}
          </section>

          {/* Specialization & Qualification section */}
          {basicFields.length > 0 && (
            <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {basicFields.map((field) => renderFieldByKey(field))}
              </div>
            </section>
          )}
        </div>
      );
    }

    if (tab === "employment") {
      const employmentFields = (fieldsByTab.employment || []).filter((f) => f.enabled);
      return (
        <div className="space-y-5 text-left">
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <Field label={t('teachers.field.employeeId')} required hint="Employee Identifier">
                  <Input
                    className={FORM_INPUT}
                    value={data.employeeId || ""}
                    onChange={(e) => setValue("employeeId", e.target.value)}
                    readOnly={autoGenerateId}
                  />
                </Field>
              </div>

              {/* Status */}
              <div>
                <Field label={t('teachers.field.status')}>
                  <select
                    className={FORM_SELECT}
                    value={data.status}
                    onChange={(e) => setValue("status", e.target.value)}
                  >
                    {statusOptions.map((s) => {
                      const translationKey = `teachers.status.${s}` as AppTranslationKey;
                      const translated = t(translationKey);
                      const label = translated === translationKey ? s.charAt(0).toUpperCase() + s.slice(1) : translated;
                      return (
                        <option key={s} value={s}>{label}</option>
                      );
                    })}
                  </select>
                </Field>
              </div>

              {/* Join Date (from registry if enabled, or render statically if not in list) */}
              {employmentFields.map((field) => renderFieldByKey(field))}

              {/* Qualification & Notes can go here if needed, or Notes at the bottom */}
              <div className="sm:col-span-2">
                <Field label={t('teachers.field.notes')}>
                  <textarea
                    rows={3}
                    className={FORM_INPUT + " min-h-[80px] py-2 resize-none"}
                    value={data.notes || ""}
                    onChange={(e) => setValue("notes", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return null;
  };

  const footerStart = linkedContact?.name ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{linkedContact.name}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span>ID: {data.employeeId || "—"}</span>
        <span className="border-s border-border ps-2 capitalize">
          Status: {data.status}
        </span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">Contact is required</span>
  );

  return (
    <MmsDynamicForm
      open
      onClose={onClose}
      title={teacher ? t('teachers.form.editTitle') : t('teachers.form.addTitle')}
      subtitle={t('teachers.form.contactHint')}
      icon={School}
      tall
      progress={completeness}
      progressLabel={t('common.formProgress')}
      showBuilderToggle={canEditSetup}
      isBuilderMode={isBuilderMode}
      onBuilderModeChange={handleToggleBuilderMode}
      tabs={formTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="teacher-form-tab"
      dir={isRtlLanguage(language) ? "rtl" : "ltr"}
      lang={language}
      error={errors.map(e => e.message)}
      cancelLabel={t('common.cancel')}
      saveLabel={t('common.save')}
      onSave={() => void handleSave(onSubmit)()}
      saving={saving}
      saveDisabled={!data.contactId}
      footerStart={footerStart}
      fields={fieldsByTab[tab] || []}
      data={data}
      setValue={(key, val, opts) => setValue(key as any, val, opts)}
      errors={errors}
      renderField={renderFieldByKey}
      renderBasicContent={renderBasicContent}
      builderPanel={
        <TeachersSettings mode="fields" />
      }
    />
  );
}
