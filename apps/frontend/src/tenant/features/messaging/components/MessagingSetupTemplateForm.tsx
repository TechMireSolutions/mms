import type React from 'react';
import { Check, Edit3, Plus } from 'lucide-react';
import type { MessageCategory } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/input';
import { MessagingMessageBodyField } from '@/components/ui/MessagingMessageBodyField';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingSetupTemplateFormProps {
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
    <SectionCard
      accentColor="primary"
      icon={editingId ? Edit3 : Plus}
      title={editingId ? t('messaging.editPreset') : t('messaging.createPreset')}
      subtitle={t('messaging.createPresetDesc')}
      actions={
        editingId ? (
          <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 self-start text-xs min-h-11">
            {t('common.cancel')}
          </Button>
        ) : undefined
      }
      className="space-y-4 shadow-sm text-start"
    >
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
    </SectionCard>
  );
}
