import React, { useEffect, useMemo, useState, useRef } from "react";
import { Loader2, User } from "lucide-react";
import { calculateProfileCompleteness, getPrimaryEmail, getPrimaryPhone } from "@mms/shared";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { useTenantProfile, TENANT_PROFILE_KEY } from "@/tenant/hooks/useTenantProfile";
import { useContactConfig } from "@/lib/contexts/ContactConfigContext";
import { genderAvatarGradient } from "@/lib/semanticTone";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { apiJson, ApiError } from "@/lib/apiClient";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { AccountProfileHeaderCard } from "./AccountProfileHeaderCard";
import { AccountProfileSettingsTabs } from "./AccountProfileSettingsTabs";
import { getPasswordStrength } from "./passwordStrength";

export default function AccountProfile(): React.JSX.Element {
  const { t } = useTranslation();
  const { checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, refetch } = useTenantProfile();
  const { fieldConfig } = useContactConfig();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [newLoginEmail, setNewLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loginEmailBusy, setLoginEmailBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [showCropper, setShowCropper] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.contact?.name ?? profile.name ?? "");
    setPhone(profile.contact ? (getPrimaryPhone(profile.contact) || "") : ((profile as unknown as Record<string, unknown>).phone as string | undefined ?? ""));
    setContactEmail(profile.contact ? (getPrimaryEmail(profile.contact) || "") : ((profile as unknown as Record<string, unknown>).email as string | undefined ?? ""));
  }, [profile]);

  const loginVerified = useMemo(
    () => Boolean(profile?.emailVerifiedAt),
    [profile?.emailVerifiedAt],
  );

  const completeness = useMemo(() => {
    if (!profile?.contact || !fieldConfig) return 0;
    return calculateProfileCompleteness(profile.contact, fieldConfig);
  }, [profile?.contact, fieldConfig]);

  const avatarGradient = useMemo(() => {
    return genderAvatarGradient(profile?.contact?.gender ?? "");
  }, [profile?.contact?.gender]);

  const passwordStrength = useMemo(() => {
    return getPasswordStrength(newPassword);
  }, [newPassword]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setShowCropper(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarCrop = async (url: string) => {
    if (!profile?.contact) return;
    setSavingContact(true);
    try {
      const emails = contactEmail.trim()
        ? [{ label: "Primary", address: contactEmail.trim().toLowerCase() }]
        : profile.contact.emails;
      await apiJson("/api/auth/me/contact", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          emails,
          avatar: url,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      await checkUserAuth();
      setShowCropper(null);
      notify.success(t("account.contactSaved"));
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : t("errors.boundary.description");
      notify.error(message);
    } finally {
      setSavingContact(false);
    }
  };

  const handleSaveContact = async (): Promise<void> => {
    if (!profile?.contact) return;
    setSavingContact(true);
    try {
      const emails = contactEmail.trim()
        ? [{ label: "Primary", address: contactEmail.trim().toLowerCase() }]
        : profile.contact.emails;
      await apiJson("/api/auth/me/contact", {
        method: "PUT",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          emails,
          avatar: profile.contact.avatar ?? undefined,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      await checkUserAuth();
      notify.success(t("account.contactSaved"));
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : t("errors.boundary.description");
      notify.error(message);
    } finally {
      setSavingContact(false);
    }
  };

  const handleRequestLoginEmail = async (): Promise<void> => {
    setLoginEmailBusy(true);
    setDevCode(null);
    try {
      const result = await apiJson<{
        challengeId: string;
        devCode?: string;
      }>("/api/auth/login-email/request", {
        method: "POST",
        body: JSON.stringify({
          newLoginEmail: newLoginEmail.trim(),
          currentPassword: loginPassword,
        }),
      });
      setChallengeId(result.challengeId);
      if (result.devCode) setDevCode(result.devCode);
      notify.success(t("account.sendCode"));
    } catch (error: unknown) {
      const message =
        error instanceof ApiError && error.type === "invalid_credentials"
          ? t("account.wrongPassword")
          : error instanceof ApiError
            ? error.message
            : t("errors.boundary.description");
      notify.error(message);
    } finally {
      setLoginEmailBusy(false);
    }
  };

  const handleConfirmLoginEmail = async (): Promise<void> => {
    if (!challengeId) return;
    setLoginEmailBusy(true);
    try {
      await apiJson("/api/auth/login-email/confirm", {
        method: "POST",
        body: JSON.stringify({ challengeId, code: verifyCode }),
      });
      setChallengeId(null);
      setVerifyCode("");
      setNewLoginEmail("");
      setLoginPassword("");
      setDevCode(null);
      await checkUserAuth();
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      notify.success(t("account.loginEmailChanged"));
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : t("errors.boundary.description");
      notify.error(message);
    } finally {
      setLoginEmailBusy(false);
    }
  };

  const handleChangePassword = async (): Promise<void> => {
    if (newPassword !== confirmPassword) {
      notify.error(t("account.passwordMismatch"));
      return;
    }
    setPasswordBusy(true);
    try {
      await apiJson("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify.success(t("account.passwordChanged"));
    } catch (error: unknown) {
      const message =
        error instanceof ApiError && error.type === "invalid_credentials"
          ? t("account.wrongPassword")
          : error instanceof ApiError
            ? error.message
            : t("errors.boundary.description");
      notify.error(message);
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleCancelLoginEmailRequest = (): void => {
    setShowEmailForm(false);
    setNewLoginEmail("");
    setLoginPassword("");
  };

  const handleCancelLoginEmailConfirm = (): void => {
    setShowEmailForm(false);
    setNewLoginEmail("");
    setLoginPassword("");
    setChallengeId(null);
    setVerifyCode("");
  };

  const handleCancelPasswordChange = (): void => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("account.title")}`}
      seoDescription={t("account.subtitle")}
      headerIcon={User}
      headerTitle={t("account.title")}
      headerSubtitle={t("account.subtitle")}
    >

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : profile ? (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <AccountProfileHeaderCard
            profile={profile}
            name={name}
            completeness={completeness}
            avatarGradient={avatarGradient}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />

          <AccountProfileSettingsTabs
            profile={profile}
            loginVerified={loginVerified}
            name={name}
            phone={phone}
            contactEmail={contactEmail}
            savingContact={savingContact}
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
            onNameChange={setName}
            onPhoneChange={setPhone}
            onContactEmailChange={setContactEmail}
            onSaveContact={handleSaveContact}
            onNewLoginEmailChange={setNewLoginEmail}
            onLoginPasswordChange={setLoginPassword}
            onVerifyCodeChange={setVerifyCode}
            onShowEmailForm={() => setShowEmailForm(true)}
            onCancelLoginEmailRequest={handleCancelLoginEmailRequest}
            onCancelLoginEmailConfirm={handleCancelLoginEmailConfirm}
            onRequestLoginEmail={handleRequestLoginEmail}
            onConfirmLoginEmail={handleConfirmLoginEmail}
            onCurrentPasswordChange={setCurrentPassword}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onShowPasswordForm={() => setShowPasswordForm(true)}
            onCancelPasswordChange={handleCancelPasswordChange}
            onChangePassword={handleChangePassword}
          />
        </div>
      ) : null}

      {showCropper && (
        <AvatarCropper
          src={showCropper}
          onCrop={handleAvatarCrop}
          onCancel={() => setShowCropper(null)}
        />
      )}
    </ModulePageShell>
  );
}
