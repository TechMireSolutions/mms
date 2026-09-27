import { FormModal } from '@/components/ui/FormModal';
import { WarningCallout } from '@/components/ui/WarningCallout';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  MessageTemplate,
  StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { MessageComposerDispatchControls } from './messageComposer/MessageComposerDispatchControls';
import { MessageComposerFormBody } from './messageComposer/MessageComposerFormBody';
import { MessageComposerRecipients } from './messageComposer/MessageComposerRecipients';
import { useMessageComposerModel } from './messageComposer/useMessageComposerModel';

export interface MessageComposerProps {
  channel: 'sms' | 'whatsapp' | 'email';
  recipients: MessagingRecipient[];
  onClose: () => void;
  templates?: MessageTemplate[];
  initialMessage?: string;
  initialSubject?: string;
  onSent?: (sent: { recipientId: string | number; body: string }[]) => void;
}

export default function MessageComposer(props: MessageComposerProps): React.JSX.Element {
  const { t } = useTranslation();
  const model = useMessageComposerModel(props);
  const { step, setStep, localRecipients, dispatch, isEmail, isSms, isBulk, Icon } = model;

  const handleClose = () => {
    if (step === 'compose' && props.recipients.length === 0) {
      setStep('pick');
    } else {
      dispatch.requestClose();
    }
  };

  const cancelLabel =
    step === 'compose' && props.recipients.length === 0
      ? t('common.previous')
      : t('common.cancel');

  return (
    <FormModal
      open
      priority
      size={step === 'pick' ? '2xl' : 'xl'}
      onClose={handleClose}
      title={model.title}
      subtitle={model.subtitle}
      icon={Icon}
      cancelLabel={cancelLabel}
      saveLabel={model.saveLabel}
      saving={step === 'compose' && (dispatch.opening || dispatch.saving)}
      onSave={model.handleSave}
      saveDisabled={model.saveDisabled}
    >
      <div
        id="debug-saveDisabled"
        data-debug={JSON.stringify({
          step,
          localRecipientsCount: localRecipients.length,
          pendingAudit: !!dispatch.pendingAudit,
          isBusy: model.isBusy,
          opening: dispatch.opening,
          saving: dispatch.saving,
          eligibleRecipientsCount: dispatch.eligibleRecipients.length,
          messageEmpty: !model.message.trim(),
          messageValue: model.message,
          isEmail,
          subjectEmpty: !model.subject.trim(),
          saveDisabled: model.saveDisabled,
        })}
      />
      <div className="space-y-4">
        {step === 'compose' && (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">{model.note}</p>
            {dispatch.pendingAudit ? (
              <WarningCallout density="compact" description={t('messaging.pendingAuditHint')} />
            ) : null}
            <MessageComposerDispatchControls
              skippedCount={dispatch.skippedRecipients.length}
              isEmail={isEmail}
              isBulk={isBulk}
              opening={dispatch.opening}
              dispatchSpeed={dispatch.dispatchSpeed}
              dispatchProgress={dispatch.dispatchProgress}
              isPaused={dispatch.isPaused}
              onShowSkipped={model.showSkipped}
              onDispatchSpeedChange={dispatch.setDispatchSpeed}
              onPausedChange={dispatch.setIsPaused}
              onCancel={dispatch.cancelDispatch}
            />
            <MessageComposerFormBody
              channel={props.channel}
              channelTemplates={model.channelTemplates}
              templateId={model.templateId}
              subject={model.subject}
              message={model.message}
              eligibleRecipients={dispatch.eligibleRecipients}
              previewIndex={model.previewIndex}
              personalizeOptions={dispatch.personalizeOptions}
              onTemplateChange={model.changeTemplate}
              onSubjectChange={model.setSubject}
              onMessageChange={model.setMessage}
              onPreviewIndexChange={model.setPreviewIndex}
            />
          </>
        )}
        <MessageComposerRecipients
          isEmail={isEmail}
          isSms={isSms}
          recipientTab={model.recipientTab}
          search={model.recipientSearch}
          displayedRecipients={model.displayedRecipients}
          validatedRecipients={dispatch.validatedRecipients}
          eligibleRecipients={dispatch.eligibleRecipients}
          skippedRecipients={dispatch.skippedRecipients}
          previewIndex={model.previewIndex}
          message={model.message}
          disabled={model.isBusy}
          onRecipientTabChange={model.setRecipientTab}
          onSearchChange={model.setRecipientSearch}
          onPreviewIndexChange={model.setPreviewIndex}
          onSendOne={dispatch.executeSend}
          onAdd={model.addRecipient}
          onRemove={model.removeRecipient}
          isPickStep={step === 'pick'}
        />
      </div>
    </FormModal>
  );
}
