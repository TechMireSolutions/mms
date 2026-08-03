import type React from 'react';
import { Check, Edit3, Plus } from 'lucide-react';
import type { MessageCategory } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { Input } from '@/components/ui/input';
import { MessagingMessageBodyField } from '@/components/ui/MessagingMessageBodyField';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingSetupTemplateFormProps {
  canEditSetup: boolean;
  canWrite: boolean;
  editingId: string | null;
  label: string;
  body: string;
  category: MessageCategory;
  channel: 'all' | 'sms' | 'whatsapp' | 'email';
  templateCategorySelectOptions: Array<{ value: string; label: string }>;
  channelSelectOptions: Array<{ value: string; label: string }>;
  onReset: () => void;
  onSave: (event: React.FormEvent) => void;
  onLabelChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onCategoryChange: (value: MessageCategory) => void;
  onChannelChange: (value: 'all' | 'sms' | 'whatsapp' | 'email') => void;
}

export function MessagingSetupTemplateForm({
  canEditSetup,
  canWrite,
  editingId,
  label,
  body,
  category,
  channel,
  templateCategorySelectOptions,
  channelSelectOptions,
  onReset,
  onSave,
  onLabelChange,
  onBodyChange,
  onCategoryChange,
  onChannelChange,
}: MessagingSetupTemplateFormProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-xs">
      {canEditSetup || canWrite ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h4 className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-foreground">
                {editingId ? <Edit3 className="h-4 w-4 shrink-0 text-primary" /> : <Plus className="h-4 w-4 shrink-0 text-primary" />}
                <span className="min-w-0 truncate">{editingId ? t('messaging.editPreset') : t('messaging.createPreset')}</span>
              </h4>
              <p className="text-xs text-muted-foreground">{t('messaging.createPresetDesc')}</p>
            </div>
            {editingId && <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 self-start text-xs">{t('common.cancel')}</Button>}
          </div>
          <form onSubmit={onSave} className="space-y-3">
            <div>
              <label className={FORM_LABEL} htmlFor="tplLabel">{t('messaging.templateLabel')}</label>
              <Input
                id="tplLabel"
                name="tplLabel"
                value={label}
                onChange={(event) => onLabelChange(event.target.value)}
                placeholder={t('messaging.templateLabelPlaceholder')}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={FORM_LABEL} htmlFor="tplCategory">{t('messaging.category')}</label>
                <FormSelect
                  id="tplCategory"
                  value={category}
                  onChange={(value) => onCategoryChange(value as MessageCategory)}
                  options={templateCategorySelectOptions}
                />
              </div>
              <div>
                <label className={FORM_LABEL} htmlFor="tplChannel">{t('messaging.targetChannel')}</label>
                <FormSelect
                  id="tplChannel"
                  value={channel}
                  onChange={(value) => onChannelChange(value as typeof channel)}
                  options={channelSelectOptions}
                />
              </div>
            </div>
            <MessagingMessageBodyField
              id="tplBody"
              value={body}
              onChange={onBodyChange}
              placeholder={t('messaging.templateBodyPlaceholder')}
              required
            />
            <Button type="submit" className="w-full font-bold">
              <Check className="me-1.5 h-4 w-4" />
              {editingId ? t('messaging.updateTemplate') : t('messaging.saveTemplate')}
            </Button>
          </form>
        </>
      ) : (
        <p className="rounded-xl border border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">{t('messaging.setup.readOnly')}</p>
      )}
    </div>
  );
}
