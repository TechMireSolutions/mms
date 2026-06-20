import React, { useCallback } from 'react';
import { Shield } from 'lucide-react';
import {
  type UsersSettings as UsersSettingsData,
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  getSortedFields,
  type ModuleCustomField,
} from '@mms/shared';
import { getObject, saveObject } from '../../lib/db';
import useTranslation from '@/hooks/useTranslation';
import { useSettingsDraft } from '@/hooks/useSettingsDraft';
import { notify } from '@/lib/notify';
import CustomFieldsBuilder, { type CustomFieldConfig } from '../ui/CustomFieldsBuilder';
import DraggableFieldList from '../ui/DraggableFieldList';
import SettingsFormActions from '../ui/SettingsFormActions';
import { Switch } from '../ui/switch';
import { SettingsCallout, SettingsPanel } from '@/components/ui/SettingsShell';

interface UsersSettingsPanelProps {
  mode?: 'fields' | 'preferences';
}

export default function UsersSettingsPanel({ mode }: UsersSettingsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const load = useCallback(
    () => getObject<UsersSettingsData>('users_settings', DEFAULT_USERS_SETTINGS),
    [],
  );

  const onSave = useCallback(
    async (draft: UsersSettingsData) => {
      saveObject('users_settings', draft);
      notify.success(t('users.settingsSaved'), { description: t('users.settingsSavedDesc') });
    },
    [t],
  );

  const { data, dirty, saving, upd, handleSave } = useSettingsDraft({
    load,
    onPreview: () => {},
    onSave,
    syncOnDatabaseUpdate: true,
  });

  const showPrefs = !mode || mode === 'preferences';
  const showFields = !mode || mode === 'fields';

  const fields = data.fields || DEFAULT_USERS_SETTINGS.fields || {};
  const customFields = data.customFields || [];
  const fieldOrder = data.fieldOrder || DEFAULT_USERS_SETTINGS.fieldOrder || [];

  const fieldLabelKeys: Record<string, string> = {
    name: 'users.fieldName',
    email: 'users.fieldEmail',
    role: 'users.fieldRole',
  };

  const orderedFields = getSortedFields(DEFAULT_USERS_FIELD_DEFS, fieldOrder, fields, customFields).map(
    (f) => ({
      ...f,
      label: fieldLabelKeys[f.id] ? t(fieldLabelKeys[f.id] as 'users.fieldName') : f.label,
    }),
  );

  const updateFieldConfig = (fieldKey: string, prop: 'enabled' | 'required', value: boolean): void => {
    const fieldObj = fields[fieldKey] || { enabled: true, required: false };
    const updatedFieldObj = { ...fieldObj, [prop]: value };
    if (prop === 'enabled' && !value) {
      updatedFieldObj.required = false;
    }
    upd('fields', { ...fields, [fieldKey]: updatedFieldObj });
  };

  const handleToggleEnabled = (id: string): void => {
    if (DEFAULT_USERS_FIELD_DEFS.some((f) => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, 'enabled', !cfg.enabled);
    }
  };

  const handleToggleRequired = (id: string): void => {
    if (DEFAULT_USERS_FIELD_DEFS.some((f) => f.id === id)) {
      const cfg = fields[id] || { enabled: true, required: false };
      updateFieldConfig(id, 'required', !cfg.required);
    } else {
      const updated = customFields.map((f) => (f.id === id ? { ...f, required: !f.required } : f));
      upd('customFields', updated);
    }
  };

  const handleReorder = (reordered: { id: string }[]): void => {
    upd('fieldOrder', reordered.map((f) => f.id));
  };

  const handleCustomFieldsChange = (newFields: CustomFieldConfig[]): void => {
    const coreIds = DEFAULT_USERS_FIELD_DEFS.map((f) => f.id);
    const newIds = newFields.map((f) => f.key);
    const kept = fieldOrder.filter((id) => coreIds.includes(id) || newIds.includes(id));
    const added = newIds.filter((id) => !kept.includes(id));
    upd('customFields', newFields.map((f) => ({ ...f, id: f.key })) as unknown as ModuleCustomField[]);
    upd('fieldOrder', [...kept, ...added]);
  };

  const enabledSet = new Set(Object.keys(fields).filter((k) => fields[k].enabled));
  const requiredSet = new Set(Object.keys(fields).filter((k) => fields[k].required));

  return (
    <SettingsPanel
      width="medium"
      introKey="users.settingsIntro"
      isDirty={dirty}
      footer={
        <SettingsFormActions
          saveLabel={t('users.settingsSave')}
          onSave={() => void handleSave()}
          dirty={dirty}
          saving={saving}
        />
      }
    >
      <SettingsCallout>{t('users.settingsNote')}</SettingsCallout>

      {showPrefs && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Shield className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-sm font-bold text-foreground">{t('users.settingsPrefsTitle')}</h3>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('users.selfRegistration')}</p>
              <p className="text-xs text-muted-foreground">{t('users.selfRegistrationDesc')}</p>
            </div>
            <Switch
              checked={data.allowSelfRegistration || false}
              onCheckedChange={(v) => upd('allowSelfRegistration', v)}
              aria-label={t('users.selfRegistration')}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('users.emailVerification')}</p>
              <p className="text-xs text-muted-foreground">{t('users.emailVerificationDesc')}</p>
            </div>
            <Switch
              checked={data.requireEmailVerification || false}
              onCheckedChange={(v) => upd('requireEmailVerification', v)}
              aria-label={t('users.emailVerification')}
            />
          </div>
        </section>
      )}

      {showFields && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground">{t('users.settingsFieldsTitle')}</h3>
          <DraggableFieldList
            tabId="users-fields"
            fields={orderedFields}
            enabledSet={enabledSet}
            requiredSet={requiredSet}
            onToggleEnabled={handleToggleEnabled}
            onToggleRequired={handleToggleRequired}
            onReorder={handleReorder}
          />
          <CustomFieldsBuilder
            fields={customFields as unknown as CustomFieldConfig[]}
            droppableId="custom-fields-users"
            onChange={handleCustomFieldsChange}
          />
        </section>
      )}
    </SettingsPanel>
  );
}
