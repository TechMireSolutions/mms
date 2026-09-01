import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Loader2, UserPlus, X } from 'lucide-react';
import {
  getInitials,
  toTitleCase,
  todayISO,
  validatePasswordPolicy,
  type SystemUser,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsersConfig } from '@/hooks/useStandardModuleConfig';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { notify } from '@/lib/notify';
import type { AddUserFormState } from './addUserModalTypes';
import { ADD_USER_MODAL_STEP_DEFS, StepIndicator } from './AddUserModalStepIndicator';
import { Step1 } from './AddUserModalStep1';
import { Step2 } from './AddUserModalStep2';
import { Step3 } from './AddUserModalStep3';

export interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: SystemUser) => void | Promise<void>;
  existingEmails?: string[];
}

export function AddUserModal({ onClose, onAdd, existingEmails = [] }: AddUserModalProps): JSX.Element {
  const { t } = useTranslation();
  const { customFields } = useUsersConfig();
  const globalSettings = useGlobalSettings();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AddUserFormState>({
    contactId: null,
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'active',
    temporaryRole: false,
    roleExpiry: '',
    setupMethod: 'invite',
    password: '',
    forceReset: true,
    twoFactorEnabled: false,
  });

  const validate = (): boolean => {
    const validationErrors: Record<string, string> = {};
    if (step === 1) {
      if (!form.contactId) validationErrors.contactId = t('users.addErrorContact');
      else if (!form.email.trim()) validationErrors.contactId = t('users.addErrorContactEmail');
      else if (existingEmails.includes(form.email.toLowerCase())) validationErrors.contactId = t('users.addErrorContactExists');
    }
    if (step === 2) {
      if (!form.role) validationErrors.role = t('users.addErrorRole');

      for (const customField of customFields) {
        if (customField.required) {
          const fieldValue = form[customField.id];
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            validationErrors.role = t('users.addErrorFieldRequired', { label: customField.label });
          }
        }
      }
    }
    if (step === 3 && form.setupMethod === 'password') {
      if (!form.password) {
        validationErrors.password = t('users.addErrorPassword');
      } else {
        const policyResult = validatePasswordPolicy(
          form.password,
          globalSettings.passwordPolicy
        );
        if (!policyResult.valid) {
          validationErrors.password = policyResult.errorKey
            ? t(policyResult.errorKey)
            : policyResult.message;
        }
      }
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleNext = (): void => {
    if (!validate()) return;
    setStep((currentStep) => currentStep + 1);
  };

  const handleBack = (): void => {
    setErrors({});
    setStep((currentStep) => currentStep - 1);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validate()) return;
    setSubmitting(true);
    const newUser: SystemUser = {
      id: `u${crypto.randomUUID()}`,
      contactId: form.contactId!,
      name: toTitleCase(form.name.trim()) as string,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.setupMethod === 'invite' ? 'inactive' : form.status,
      mustChangePassword: form.setupMethod === 'password' ? form.forceReset !== false : false,
      temporaryPassword: form.setupMethod === 'password' ? form.password : undefined,
      twoFactorEnabled: form.twoFactorEnabled,
      lastLogin: '',
      createdDate: todayISO(),
      failedLoginAttempts: 0,
      activeSessions: 0,
      avatarInitials: getInitials(form.name),
      ...Object.fromEntries(
        customFields.map((customField) => [customField.id, form[customField.id] ?? customField.defaultValue ?? ''])
      ),
    };
    try {
      await onAdd(newUser);
      setSuccess(true);
      onClose();
    } catch (error: unknown) {
      notify.error(t('errors.module.title'), {
        description: error instanceof Error ? error.message : t('errors.module.description'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open
      onClose={onClose}
      title={t('users.addTitle')}
      subtitle={t('users.addSubtitle')}
      icon={UserPlus}
      size="lg"
      hideFooter
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-10 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{t('users.addSuccessTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.setupMethod === 'invite'
                ? t('users.addSuccessInvite', { email: form.email })
                : t('users.addSuccessPassword', { name: form.name })}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <StepIndicator step={step} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <Step1 form={form} setForm={setForm} errors={errors} />
              )}
              {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
              {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex w-full items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={step === 1 ? onClose : handleBack}>
              {step === 1 ? <X className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {step === 1 ? t('users.cancel') : t('users.addBack')}
            </Button>
            <div className="flex items-center gap-1.5">
              {ADD_USER_MODAL_STEP_DEFS.map((stepDefinition) => (
                <div
                  key={stepDefinition.id}
                  className={`h-1.5 rounded-full transition-all ${step === stepDefinition.id ? 'w-3 bg-primary' : step > stepDefinition.id ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-border'}`}
                />
              ))}
            </div>
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                {t('users.addNext')} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="button" onClick={() => { void handleSubmit(); }} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {submitting ? t('users.addCreating') : t('users.addCreate')}
              </Button>
            )}
          </div>
        </>
      )}
    </FormModal>
  );
}
