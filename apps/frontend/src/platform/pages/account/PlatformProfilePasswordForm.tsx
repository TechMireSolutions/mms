import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/PasswordInput";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdatePlatformPassword } from "@/platform/hooks/usePlatformProfile";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import {
  getPlatformPasswordError,
  getPlatformPasswordMatchError,
} from "@/platform/lib/platformValidation";
import { notify } from "@/lib/notify";
import { ROUTES } from "@/lib/config/routes";

export function PlatformProfilePasswordForm(): React.JSX.Element {
  const { t } = useTranslation();
  const updatePassword = useUpdatePlatformPassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

  return (
    <>
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
    </>
  );
}
