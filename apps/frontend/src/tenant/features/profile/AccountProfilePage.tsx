import type { JSX } from 'react';
import { Loader2, User } from 'lucide-react';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { AvatarCropper } from '@/components/ui/AvatarCropper';
import { AccountProfileHeaderCard } from '@/tenant/features/profile/AccountProfileHeaderCard';
import { AccountProfileSettingsTabs } from '@/tenant/features/profile/AccountProfileSettingsTabs';
import { useAccountProfilePageController } from '@/tenant/features/profile/hooks/useAccountProfilePageController';

export default function AccountProfile(): JSX.Element {
  const c = useAccountProfilePageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${c.t('account.title')}`}
      seoDescription={c.t('account.subtitle')}
      headerIcon={User}
      headerTitle={c.t('account.title')}
      headerSubtitle={c.t('account.subtitle')}
    >
      {c.isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : c.profile ? (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <AccountProfileHeaderCard
            profile={c.profile}
            name={c.name}
            completeness={c.completeness}
            avatarGradient={c.avatarGradient}
            fileInputRef={c.fileInputRef}
            onFileChange={c.handleFileChange}
          />

          <AccountProfileSettingsTabs
            profile={c.profile}
            loginVerified={c.loginVerified}
            name={c.name}
            phone={c.phone}
            contactEmail={c.contactEmail}
            savingContact={c.savingContact}
            newLoginEmail={c.newLoginEmail}
            loginPassword={c.loginPassword}
            challengeId={c.challengeId}
            verifyCode={c.verifyCode}
            devCode={c.devCode}
            loginEmailBusy={c.loginEmailBusy}
            currentPassword={c.currentPassword}
            newPassword={c.newPassword}
            confirmPassword={c.confirmPassword}
            passwordBusy={c.passwordBusy}
            showEmailForm={c.showEmailForm}
            showPasswordForm={c.showPasswordForm}
            passwordStrength={c.passwordStrength}
            onNameChange={c.setName}
            onPhoneChange={c.setPhone}
            onContactEmailChange={c.setContactEmail}
            onSaveContact={c.handleSaveContact}
            onNewLoginEmailChange={c.setNewLoginEmail}
            onLoginPasswordChange={c.setLoginPassword}
            onVerifyCodeChange={c.setVerifyCode}
            onShowEmailForm={() => c.setShowEmailForm(true)}
            onCancelLoginEmailRequest={c.handleCancelLoginEmailRequest}
            onCancelLoginEmailConfirm={c.handleCancelLoginEmailConfirm}
            onRequestLoginEmail={c.handleRequestLoginEmail}
            onConfirmLoginEmail={c.handleConfirmLoginEmail}
            onCurrentPasswordChange={c.setCurrentPassword}
            onNewPasswordChange={c.setNewPassword}
            onConfirmPasswordChange={c.setConfirmPassword}
            onShowPasswordForm={() => c.setShowPasswordForm(true)}
            onCancelPasswordChange={c.handleCancelPasswordChange}
            onChangePassword={c.handleChangePassword}
          />
        </div>
      ) : null}

      {c.showCropper && (
        <AvatarCropper
          src={c.showCropper}
          onCrop={c.handleAvatarCrop}
          onCancel={() => c.setShowCropper(null)}
        />
      )}
    </ModulePageShell>
  );
}
