import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useTenantProfile, TENANT_PROFILE_KEY } from '@/tenant/hooks/useTenantProfile';
import { apiJson, ApiError } from '@/lib/apiClient';
import { notify } from '@/lib/notify';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export function useAccountProfileSecurityActions() {
  const { t } = useTranslation();
  const { checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const { refetch } = useTenantProfile();

  const [newLoginEmail, setNewLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loginEmailBusy, setLoginEmailBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleRequestLoginEmail = async (): Promise<void> => {
    setLoginEmailBusy(true);
    setDevCode(null);
    try {
      const result = await apiJson<{
        challengeId: string;
        devCode?: string;
      }>('/api/auth/login-email/request', {
        method: 'POST',
        body: JSON.stringify({
          newLoginEmail: newLoginEmail.trim(),
          currentPassword: loginPassword,
        }),
      });
      setChallengeId(result.challengeId);
      if (result.devCode) setDevCode(result.devCode);
      notify.success(t('account.sendCode'));
    } catch (error: unknown) {
      const message =
        error instanceof ApiError && error.type === 'invalid_credentials'
          ? t('account.wrongPassword')
          : error instanceof ApiError
            ? error.message
            : t('errors.boundary.description');
      notify.error(message);
    } finally {
      setLoginEmailBusy(false);
    }
  };

  const handleConfirmLoginEmail = async (): Promise<void> => {
    if (!challengeId) return;
    setLoginEmailBusy(true);
    try {
      await apiJson('/api/auth/login-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ challengeId, code: verifyCode }),
      });
      setChallengeId(null);
      setVerifyCode('');
      setNewLoginEmail('');
      setLoginPassword('');
      setDevCode(null);
      await checkUserAuth();
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      notify.success(t('account.loginEmailChanged'));
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : t('errors.boundary.description');
      notify.error(message);
    } finally {
      setLoginEmailBusy(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (newPassword !== confirmPassword) {
      notify.error(t('account.passwordMismatch'));
      return;
    }
    setPasswordBusy(true);
    try {
      await apiJson('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      notify.success(t('account.passwordChanged'));
    } catch (error: unknown) {
      const message =
        error instanceof ApiError && error.type === 'invalid_credentials'
          ? t('account.wrongPassword')
          : error instanceof ApiError
            ? error.message
            : t('errors.boundary.description');
      notify.error(message);
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleCancelLoginEmailRequest = (): void => {
    setShowEmailForm(false);
    setNewLoginEmail('');
    setLoginPassword('');
  };

  const handleCancelLoginEmailConfirm = (): void => {
    setShowEmailForm(false);
    setNewLoginEmail('');
    setLoginPassword('');
    setChallengeId(null);
    setVerifyCode('');
  };

  const handleCancelPasswordChange = (): void => {
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return {
    newLoginEmail,
    loginPassword,
    challengeId,
    verifyCode,
    devCode,
    loginEmailBusy,
    currentPassword,
    newPassword,
    confirmPassword,
    passwordBusy,
    showEmailForm,
    showPasswordForm,
    setNewLoginEmail,
    setLoginPassword,
    setVerifyCode,
    setCurrentPassword,
    setNewPassword,
    setConfirmPassword,
    setShowEmailForm,
    setShowPasswordForm,
    handleRequestLoginEmail,
    handleConfirmLoginEmail,
    handleChangePassword,
    handleCancelLoginEmailRequest,
    handleCancelLoginEmailConfirm,
    handleCancelPasswordChange,
  };
}
