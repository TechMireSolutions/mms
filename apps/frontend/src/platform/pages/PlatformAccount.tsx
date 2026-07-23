import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDate } from "@mms/shared";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import PasswordInput from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
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
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { PageHeader } from "@/components/ui/PageHeader";

import { containerVariants, itemVariants as cardVariants } from "@/platform/lib/animations";

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
    <PlatformPageShell width="7xl">
      <div className="space-y-8">
        <PageHeader
          title={t("platform.profileTitle")}
          subtitle={t("platform.profileSubtitle")}
        />

        {loadingProfile ? (
          <RouteStatusFallback />
        ) : profile && !profileError ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Left Side Info / Quick Actions (1/3 width) */}
            <motion.div variants={cardVariants} className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
                {t("platform.myAccount")}
              </h2>
              
              <Card accentColor="primary" className="p-6 space-y-4 text-start">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-muted-foreground">{t("platform.profileEmail")}</span>
                  <span className="font-semibold text-foreground ms-auto truncate max-w-[150px]">{profile.email}</span>
                </div>
                {memberSince ? (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                    <span className="text-muted-foreground">{t("platform.profileMemberSince")}</span>
                    <span className="font-semibold text-foreground ms-auto">{memberSince}</span>
                  </div>
                ) : null}
                {profile.emailVerifiedAt ? (
                  <div className="flex items-center gap-2 text-sm text-primary font-bold pt-2 border-t border-border/40">
                    <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                    <span>{t("platform.profileEmailVerified")}</span>
                  </div>
                ) : null}
              </Card>

              {isSuperUser && (
                <div className="space-y-6">
                  <Card accentColor="destructive" className="p-6 space-y-4 text-start border-destructive/10 bg-destructive/5">
                    <h3 className="text-sm font-bold text-destructive">{t("platform.profileDestroyDatabase")}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("platform.profileDestroyDatabaseDesc")}
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full font-bold h-10 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                        <AlertDialogTitle className="text-destructive font-bold">{t("platform.profileDestroyDatabaseTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("platform.profileDestroyDatabaseDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-3 my-2 text-start">
                        <p className="text-xs text-muted-foreground font-semibold">
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
                          className="min-h-[44px]"
                        />
                        {resetError ? (
                          <p className="text-xs text-destructive font-bold" role="alert">
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
                </div>
              )}
            </motion.div>

            {/* Right Side Settings Forms (2/3 width) */}
            <motion.div variants={cardVariants} className="lg:col-span-2 space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
                {t("platform.profileName")}
              </h2>
              
              <Card accentColor="indigo" className="p-0 overflow-hidden">
                <form onSubmit={(event) => void handleSaveName(event)} className="p-6 space-y-4 text-start">
                  <h3 className="text-sm font-bold text-foreground">{t("platform.profileName")}</h3>
                  {nameError ? <Alert message={nameError} /> : null}
                  <div className="space-y-1.5">
                    <label htmlFor="platform-profile-name" className={FORM_LABEL}>{t("platform.profileName")}</label>
                    <Input
                      id="platform-profile-name"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="min-h-[44px]"
                    />
                  </div>
                  <Button type="submit" className="w-fit px-6 font-bold h-10 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={updateName.isPending || name === platformUser?.name}>
                    {updateName.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                        {t("common.save")}
                      </>
                    ) : (
                      t("platform.profileSave")
                    )}
                  </Button>
                </form>
              </Card>

              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
                {t("platform.profileChangePassword")}
              </h2>

              <Card accentColor="emerald" className="p-0 overflow-hidden">
                <form onSubmit={(event) => void handleChangePassword(event)} className="p-6 space-y-4 text-start">
                  <h3 className="text-sm font-bold text-foreground">{t("platform.profileChangePassword")}</h3>
                  {passwordError ? <Alert message={passwordError} /> : null}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <PasswordInput
                        id="platform-current-password"
                        label={t("platform.profileCurrentPassword")}
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                      />
                    </div>
                    <PasswordInput
                      id="platform-new-password"
                      label={t("platform.profileNewPassword")}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <PasswordInput
                      id="platform-confirm-new-password"
                      label={t("platform.profileConfirmPassword")}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <Button type="submit" className="w-fit px-6 font-bold h-10 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={updatePassword.isPending}>
                      {updatePassword.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                          {t("common.save")}
                        </>
                      ) : (
                        t("platform.profileChangePassword")
                      )}
                    </Button>
                    <Link to={ROUTES.platformForgotPassword} className="text-xs text-primary font-bold hover:underline">
                      {t("platform.profileForgotLink")}
                    </Link>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        ) : (
          <p className="text-sm text-destructive text-center" role="alert">
            {t("errors.boundary.description")}
          </p>
        )}
      </div>
    </PlatformPageShell>
  );
}
