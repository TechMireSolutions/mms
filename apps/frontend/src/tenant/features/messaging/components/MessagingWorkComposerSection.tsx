import type { JSX } from 'react';
import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import type { StandardMessagingRecipient as MessagingRecipient } from '@mms/shared';
import { Button } from '@/components/ui/button';
import { WORK_SURFACE } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';

interface MessagingWorkComposerSectionProps {
  canWrite: boolean;
  selectedList: MessagingRecipient[];
  onCompose: (channel: 'sms' | 'whatsapp' | 'email') => void;
}

export function MessagingWorkComposerSection({
  canWrite,
  selectedList,
  onCompose,
}: MessagingWorkComposerSectionProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`${WORK_SURFACE} flex flex-col justify-between space-y-4 p-4`}>
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">{t('messaging.stepConfirmDispatch')}</h4>
          <p className="text-xs text-muted-foreground">{t('messaging.confirmRecipientsDesc')}</p>
        </div>
        <div className="space-y-2 rounded-xl border border-border/40 bg-muted/40 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t('messaging.contactsChecked')}:</span>
            <span className="font-bold">{selectedList.length}</span>
          </div>
          {selectedList.length > 0 && (
            <div className="max-h-36 space-y-1 overflow-y-auto rounded border border-border/30 bg-background p-1.5">
              {selectedList.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground"
                >
                  <span className="min-w-0 truncate">{recipient.name}</span>
                  <span className="shrink-0 font-mono truncate max-w-1/2">{recipient.phone || recipient.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {canWrite && (
        <div className="space-y-2">
          <Button
            onClick={() => onCompose('whatsapp')}
            disabled={!selectedList.length}
            className="w-full bg-success font-semibold text-success-foreground hover:bg-success/90"
          >
            <MessageCircle className="me-2 h-4 w-4" />
            {t('messaging.sendWhatsapp')}
          </Button>
          <Button
            onClick={() => onCompose('sms')}
            disabled={!selectedList.length}
            className="w-full bg-info font-semibold text-info-foreground hover:bg-info/90"
          >
            <MessageSquare className="me-2 h-4 w-4" />
            {t('messaging.sendSms')}
          </Button>
          <Button
            onClick={() => onCompose('email')}
            disabled={!selectedList.length}
            className="w-full bg-warning font-semibold text-warning-foreground hover:bg-warning/90"
          >
            <Mail className="me-2 h-4 w-4" />
            {t('messaging.sendEmail')}
          </Button>
        </div>
      )}
    </div>
  );
}
