import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { formatDate } from "@mms/shared";
import { PlatformPageShell, PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import PlatformPasswordInput from "@/platform/components/PlatformPasswordInput";
import { PlatformAlert } from "@/platform/components/PlatformAlert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import {
  usePlatformProfile,
  useUpdatePlatformPassword,
  useUpdatePlatformProfileName,
} from "@/platform/hooks/usePlatformProfile";
import { useResetPlatformDatabase } from "@/platform/hooks/usePlatformSettings";
import { notify } from "@/lib/notify";
import {
  getPlatformNameError,
  getPlatformPasswordError,
  getPlatformPasswordMatchError,
} from "@/platform/lib/platformValidation";

/**
 * Platform super-user profile — view name/email and update display name or password.
 */
export default function PlatformAccount(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser } = usePlatformAuth();
  const { data: profile, isLoading: loadingProfile, isError: profileError } = usePlatformProfile();
  const updateName = useUpdatePlatformProfileName();
  const updatePassword = useUpdatePlatformPassword();
  const resetDbMutation = useResetPlatformDatabase();
  const isSuperUser = platformUser?.role === "super_user";


  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);


  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetDatabase = async (): Promise<void> => {
    if (confirmText !== "RESET_ALL_DATABASE_DATA") return;
    setResetError(null);
    try {
      await resetDbMutation.mutateAsync(confirmText);
      setResetDialogOpen(false);
      setConfirmText("");
    } catch (err) {
      setResetError(getPlatformErrorMessage(err, t));
    }
  };



  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);



  const handleSaveName = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setNameError(null);

    const nameError = getPlatformNameError(name, t);
    if (nameError) {
      setNameError(nameError);
      return;
    }

    try {
      await updateName.mutateAsync(name);
      notify.success(t("platform.profileSaved"));
    } catch (err) {
      setNameError(getPlatformErrorMessage(err, t));
    }
  };

  const handleChangePassword = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setPasswordError(null);

    const matchError = getPlatformPasswordMatchError(newPassword, confirmPassword, t);
    if (matchError) {
      setPasswordError(matchError);
      return;
    }

    const passwordError = getPlatformPasswordError(newPassword, t);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    try {
      await updatePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify.success(t("platform.profilePasswordUpdated"));
    } catch (err) {
      setPasswordError(getPlatformErrorMessage(err, t));
    }
  };

  const memberSince = profile?.createdAt
    ? formatDate(profile.createdAt)
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
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden />
          {t("platform.backToConsole")}
        </Link>

        {loadingProfile ? (
          <div className="flex justify-center py-8" role="status">
            <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
            <span className="sr-only">{t("common.loading")}</span>
          </div>
        ) : profile && !profileError ? (
          <>
            <Card accentColor="primary" className="p-5 ps-6.5 space-y-3 text-start">
              <div className="flex items-center gap-2 text-sm ms-0.5">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                <span className="text-muted-foreground">{t("platform.profileEmail")}</span>
                <span className="font-medium text-foreground ms-auto truncate">{profile.email}</span>
              </div>
              {memberSince ? (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-muted-foreground">{t("platform.profileMemberSince")}</span>
                  <span className="font-medium text-foreground ms-auto">{memberSince}</span>
                </div>
              ) : null}
              {profile.emailVerifiedAt ? (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                  <span>{t("platform.profileEmailVerified")}</span>
                </div>
              ) : null}
            </Card>

            <Card accentColor="indigo" className="p-0">
              <form onSubmit={(event) => void handleSaveName(event)} className="p-5 ps-6.5 space-y-4 text-start">
              <h2 className="text-sm font-semibold text-foreground ms-0.5">{t("platform.profileName")}</h2>
              {nameError ? <PlatformAlert message={nameError} /> : null}
              <div className="space-y-1.5">
                <label htmlFor="platform-profile-name" className={FORM_LABEL}>{t("platform.profileName")}</label>
                <Input
                  id="platform-profile-name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
            </Card>

            <Card accentColor="emerald" className="p-0">
              <form onSubmit={(event) => void handleChangePassword(event)} className="p-5 ps-6.5 space-y-4 text-start">
              <h2 className="text-sm font-semibold text-foreground ms-0.5">{t("platform.profileChangePassword")}</h2>
              {passwordError ? <PlatformAlert message={passwordError} /> : null}
              <PlatformPasswordInput
                id="platform-current-password"
                label={t("platform.profileCurrentPassword")}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <PlatformPasswordInput
                id="platform-new-password"
                label={t("platform.profileNewPassword")}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <PlatformPasswordInput
                id="platform-confirm-new-password"
                label={t("platform.profileConfirmPassword")}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button type="submit" className="w-full" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? (
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
            </Card>

            {isSuperUser && (
              <>
                <Card accentColor="destructive" className="p-5 ps-6.5 space-y-4 text-start">
                  <h2 className="text-sm font-semibold text-foreground ms-0.5">{t("platform.profileDestroyDatabase")}</h2>
                  <p className="text-xs text-muted-foreground ms-0.5">
                    {t("platform.profileDestroyDatabaseDesc")}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setResetError(null);
                      setConfirmText("");
                      setResetDialogOpen(true);
                    }}
                  >
                    {t("platform.profileDestroyDatabaseButton")}
                  </Button>
                </Card>

                <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">{t("platform.profileDestroyDatabaseTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("platform.profileDestroyDatabaseDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-3 my-2 text-start">
                      <p className="text-xs text-muted-foreground">
                        {t("platform.profileDestroyDatabasePrompt")}
                      </p>
                      <Input
                        type="text"
                        value={confirmText}
                        onChange={(event) => {
                          setConfirmText(event.target.value);
                          if (resetError) setResetError(null);
                        }}
                        placeholder="RESET_ALL_DATABASE_DATA"
                        disabled={resetDbMutation.isPending}
                      />
                      {resetError ? (
                        <p className="text-xs text-destructive" role="alert">
                          {resetError}
                        </p>
                      ) : null}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={resetDbMutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={resetDbMutation.isPending || confirmText !== "RESET_ALL_DATABASE_DATA"}
                        onClick={handleResetDatabase}
                      >
                        {resetDbMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                            {t("platform.profileDestroyDatabaseConfirm")}
                          </>
                        ) : (
                          t("platform.profileDestroyDatabaseConfirm")
                        )}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
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
