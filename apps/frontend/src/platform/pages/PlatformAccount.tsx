import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import {
  PLATFORM_MIN_PASSWORD_LENGTH,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
} from "@mms/shared";
import { PlatformPageShell, PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { Button } from "@/components/ui/button";
import { FORM_INPUT, FORM_INPUT_ICON, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { apiJson, ApiError } from "@/lib/apiClient";
import { mapPlatformAuthError } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformProfile, useUpdatePlatformProfileName } from "@/platform/hooks/usePlatformProfile";
import { PlatformLoadingScreen } from "@/platform/components/PlatformLoadingScreen";
import { notify } from "@/lib/notify";

/**
 * Platform super-user profile — view name/email and update display name or password.
 */
export default function PlatformAccount(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    platformUser,
    isPlatformAuthenticated,
    platformAuthChecked,
    isCheckingPlatformAuth,
  } = usePlatformAuth();
  const { data: profile, isLoading: loadingProfile, isError: profileError } = usePlatformProfile();
  const updateName = useUpdatePlatformProfileName();

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSaveName = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setNameError(null);

    const nameKey = validatePlatformSetupName(name);
    if (nameKey) {
      setNameError(t(nameKey));
      return;
    }

    try {
      await updateName.mutateAsync(name);
      notify.success(t("platform.profileSaved"));
    } catch (error) {
      setNameError(
        error instanceof ApiError ? mapPlatformAuthError(error, t) : t("errors.boundary.description"),
      );
    }
  };

  const handleChangePassword = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError(t("platform.forgotPasswordMismatch"));
      return;
    }

    const passwordKey = validatePlatformSetupPassword(newPassword);
    if (passwordKey) {
      setPasswordError(
        passwordKey === "platform.setupPasswordTooShort"
          ? t(passwordKey, { min: String(PLATFORM_MIN_PASSWORD_LENGTH) })
          : t(passwordKey),
      );
      return;
    }

    setSavingPassword(true);
    try {
      await apiJson("/api/platform/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify.success(t("platform.profilePasswordUpdated"));
    } catch (error) {
      setPasswordError(
        error instanceof ApiError ? mapPlatformAuthError(error, t) : t("errors.boundary.description"),
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : null;

  return (
    <PlatformPageShell width="md">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <PlatformLogoMark />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("platform.profileTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("platform.profileSubtitle")}</p>
          </div>
        </div>

        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          {t("platform.backToConsole")}
        </Link>

        {loadingProfile ? (
          <div className="flex justify-center py-8" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        ) : profile && !profileError ? (
          <>
            <section className="rounded-xl border border-border bg-card p-4 space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                <span className="text-muted-foreground">{t("platform.profileEmail")}</span>
                <span className="font-medium text-foreground ml-auto truncate">{profile.email}</span>
              </div>
              {memberSince ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-muted-foreground">{t("platform.profileMemberSince")}</span>
                  <span className="font-medium text-foreground ml-auto">{memberSince}</span>
                </div>
              ) : null}
              {profile.emailVerifiedAt ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t("platform.profileEmailVerified")}</span>
                </div>
              ) : null}
            </section>

            <form onSubmit={(e) => void handleSaveName(e)} className="rounded-xl border border-border bg-card p-4 space-y-4 text-left">
              <h2 className="text-sm font-semibold text-foreground">{t("platform.profileName")}</h2>
              {nameError ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  <span>{nameError}</span>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label htmlFor="platform-profile-name" className={FORM_LABEL}>{t("platform.profileName")}</label>
                <input
                  id="platform-profile-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FORM_INPUT}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateName.isPending || name === platformUser?.name}>
                {updateName.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    {t("common.save")}
                  </>
                ) : (
                  t("platform.profileSave")
                )}
              </Button>
            </form>

            <form onSubmit={(e) => void handleChangePassword(e)} className="rounded-xl border border-border bg-card p-4 space-y-4 text-left">
              <h2 className="text-sm font-semibold text-foreground">{t("platform.profileChangePassword")}</h2>
              {passwordError ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                  <span>{passwordError}</span>
                </div>
              ) : null}
              <div className="space-y-1.5">
                <label htmlFor="platform-current-password" className={FORM_LABEL}>{t("platform.profileCurrentPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <input
                    id="platform-current-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={FORM_INPUT_ICON}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="platform-new-password" className={FORM_LABEL}>{t("platform.profileNewPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <input
                    id="platform-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PLATFORM_MIN_PASSWORD_LENGTH}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={FORM_INPUT_ICON}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="platform-confirm-new-password" className={FORM_LABEL}>{t("platform.profileConfirmPassword")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                  <input
                    id="platform-confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={PLATFORM_MIN_PASSWORD_LENGTH}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={FORM_INPUT_ICON}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={savingPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    {t("common.save")}
                  </>
                ) : (
                  t("platform.profileChangePassword")
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link to={ROUTES.platformForgotPassword} className="text-primary font-medium hover:underline">
                  {t("platform.profileForgotLink")}
                </Link>
              </p>
            </form>
          </>
        ) : (
          <p className="text-sm text-destructive text-center" role="alert">
            {t("errors.boundary.description")}
          </p>
        )}
      </div>
    </PlatformPageShell>
  );
}
