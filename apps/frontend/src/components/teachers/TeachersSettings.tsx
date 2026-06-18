import React, { useState } from 'react';
import { Save, School } from 'lucide-react';
import { getObject, saveObject } from '@/lib/db';
import {
  type TeachersSettings,
  DEFAULT_TEACHERS_SETTINGS,
  TEACHER_SPECIALIZATION_VALUES,
  getSortedTeacherFields,
  DEFAULT_TEACHER_FIELD_DEFS,
  type AppTranslationKey,
} from '@mms/shared';
import useTranslation from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ label, description, value, onChange }: ToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        style={{
          width: 40,
          height: 22,
          background: value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
          borderRadius: 999,
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            width: 17,
            height: 17,
            top: 2.5,
            left: value ? 19 : 3,
            position: 'absolute',
            borderRadius: '50%',
            background: 'white',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}

export default function TeachersSettings({ mode }: { mode?: 'fields' | 'preferences' }): React.ReactElement {
  const { t } = useTranslation();
  const [data, setData] = useState<TeachersSettings>(() =>
    getObject<TeachersSettings>('teachers_settings', DEFAULT_TEACHERS_SETTINGS),
  );
  const [saved, setSaved] = useState(false);

  const upd = <K extends keyof TeachersSettings>(f: K, v: TeachersSettings[K]) => {
    setData((d) => ({ ...d, [f]: v }));
    setSaved(false);
  };

  const handleSave = () => {
    saveObject('teachers_settings', data);
    setSaved(true);
    notify.success(t('teachers.settings.saved'));
  };

  if (mode === 'fields') {
    const fields = data.fields || DEFAULT_TEACHERS_SETTINGS.fields || {};
    const orderedFields = getSortedTeacherFields(data.fieldOrder, fields, data.customFields);

    const updateFieldConfig = (fieldKey: string, prop: 'enabled' | 'required', value: boolean) => {
      const fieldObj = fields[fieldKey] || { enabled: true, required: false };
      const updatedFieldObj = { ...fieldObj, [prop]: value };
      if (prop === 'enabled' && !value) updatedFieldObj.required = false;
      upd('fields', { ...fields, [fieldKey]: updatedFieldObj });
    };

    return (
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t('teachers.settings.title')}</h3>
        <div className="space-y-2">
          {orderedFields.filter((f) => DEFAULT_TEACHER_FIELD_DEFS.some((d) => d.id === f.id)).map((field) => {
            const cfg = fields[field.id] || { enabled: true, required: false };
            const label = field.labelKey ? t(field.labelKey as AppTranslationKey) : (field.label ?? field.id);
            return (
              <div key={field.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <span className="text-sm text-foreground">{label}</span>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={cfg.enabled !== false} onChange={(e) => updateFieldConfig(field.id, 'enabled', e.target.checked)} />
                    {t('teachers.settings.fieldVisible')}
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={cfg.required === true} onChange={(e) => updateFieldConfig(field.id, 'required', e.target.checked)} />
                    {t('teachers.settings.fieldRequired')}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Save className="w-4 h-4" />
          {t('common.save')}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <School className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('teachers.settings.title')}</h3>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL}>{t('teachers.settings.idPrefix')}</label>
          <input
            className={FORM_INPUT}
            value={data.idPrefix}
            onChange={(e) => upd('idPrefix', e.target.value)}
          />
        </div>

        <Toggle
          label={t('teachers.settings.autoGenerateId')}
          value={data.autoGenerateId}
          onChange={(v) => upd('autoGenerateId', v)}
        />

        <Toggle
          label={t('teachers.settings.requireContactLink')}
          value={data.requireContactLink}
          onChange={(v) => upd('requireContactLink', v)}
        />

        <div>
          <label className={FORM_LABEL}>{t('teachers.settings.defaultSpecialization')}</label>
          <select
            className={FORM_INPUT}
            value={data.defaultSpecialization}
            onChange={(e) => upd('defaultSpecialization', e.target.value)}
          >
            {TEACHER_SPECIALIZATION_VALUES.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Save className="w-4 h-4" />
        {saved ? t('settings.savedBadge') : t('common.save')}
      </button>
    </div>
  );
}
