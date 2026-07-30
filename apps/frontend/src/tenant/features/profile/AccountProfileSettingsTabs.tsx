import type React from "react";
import { Lock, User } from "lucide-react";
import type { TenantUserProfile } from "@mms/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import { AccountProfileContactTab } from "./AccountProfileContactTab";
import { AccountProfileSecurityTab } from "./AccountProfileSecurityTab";
import type { PasswordStrengthResult } from "./passwordStrength";

interface AccountProfileSettingsTabsProps {
  profile: TenantUserProfile;
  loginVerified: boolean;
  name: string;
  phone: string;
  contactEmail: string;
  savingContact: boolean;
  newLoginEmail: string;
  loginPassword: string;
  challengeId: string | null;
  verifyCode: string;
  devCode: string | null;
  loginEmailBusy: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordBusy: boolean;
  showEmailForm: boolean;
  showPasswordForm: boolean;
  passwordStrength: PasswordStrengthResult;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onSaveContact: () => Promise<void>;
  onNewLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onVerifyCodeChange: (value: string) => void;
  onShowEmailForm: () => void;
  onCancelLoginEmailRequest: () => void;
  onCancelLoginEmailConfirm: () => void;
  onRequestLoginEmail: () => Promise<void>;
  onConfirmLoginEmail: () => Promise<void>;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordForm: () => void;
  onCancelPasswordChange: () => void;
  onChangePassword: () => Promise<void>;
}

export function AccountProfileSettingsTabs({
  profile,
  loginVerified,
  name,
  phone,
  contactEmail,
  savingContact,
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
  passwordStrength,
  onNameChange,
  onPhoneChange,
  onContactEmailChange,
  onSaveContact,
  onNewLoginEmailChange,
  onLoginPasswordChange,
  onVerifyCodeChange,
  onShowEmailForm,
  onCancelLoginEmailRequest,
  onCancelLoginEmailConfirm,
  onRequestLoginEmail,
  onConfirmLoginEmail,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordForm,
  onCancelPasswordChange,
  onChangePassword,
}: AccountProfileSettingsTabsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted/60 p-1 border border-border/40 backdrop-blur-sm rounded-xl">
        <TabsTrigger
          value="profile"
          className="flex items-center justify-center gap-2 rounded-lg py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-300 font-semibold"
        >
          <User className="h-4 w-4 shrink-0" />
          {t("account.contactSection")}
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="flex items-center justify-center gap-2 rounded-lg py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-300 font-semibold"
        >
          <Lock className="h-4 w-4 shrink-0" />
          {t("account.loginSection")}
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="profile"
        className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 focus-visible:outline-none"
      >
        <AccountProfileContactTab
          profile={profile}
          name={name}
          phone={phone}
          contactEmail={contactEmail}
          savingContact={savingContact}
          onNameChange={onNameChange}
          onPhoneChange={onPhoneChange}
          onContactEmailChange={onContactEmailChange}
          onSaveContact={onSaveContact}
        />
      </TabsContent>

      <TabsContent
        value="security"
        className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 focus-visible:outline-none"
      >
        <AccountProfileSecurityTab
          profile={profile}
          loginVerified={loginVerified}
          newLoginEmail={newLoginEmail}
          loginPassword={loginPassword}
          challengeId={challengeId}
          verifyCode={verifyCode}
          devCode={devCode}
          loginEmailBusy={loginEmailBusy}
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordBusy={passwordBusy}
          showEmailForm={showEmailForm}
          showPasswordForm={showPasswordForm}
          passwordStrength={passwordStrength}
          onNewLoginEmailChange={onNewLoginEmailChange}
          onLoginPasswordChange={onLoginPasswordChange}
          onVerifyCodeChange={onVerifyCodeChange}
          onShowEmailForm={onShowEmailForm}
          onCancelLoginEmailRequest={onCancelLoginEmailRequest}
          onCancelLoginEmailConfirm={onCancelLoginEmailConfirm}
          onRequestLoginEmail={onRequestLoginEmail}
          onConfirmLoginEmail={onConfirmLoginEmail}
          onCurrentPasswordChange={onCurrentPasswordChange}
          onNewPasswordChange={onNewPasswordChange}
          onConfirmPasswordChange={onConfirmPasswordChange}
          onShowPasswordForm={onShowPasswordForm}
          onCancelPasswordChange={onCancelPasswordChange}
          onChangePassword={onChangePassword}
        />
      </TabsContent>
    </Tabs>
  );
}
