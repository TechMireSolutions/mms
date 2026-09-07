import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Key } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import PasswordInput from "@/components/ui/PasswordInput";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { useTranslation } from "@/hooks/useTranslation";
import { useUpdatePlatformPassword } from "@/platform/hooks/usePlatformProfile";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import {
  getPlatformPasswordError,
  getPlatformPasswordMatchError,
} from "@/platform/lib/platformValidation";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { notify } from "@/lib/notify";
import { ROUTES } from "@/lib/config/routes";
import { PLATFORM_PROFILE_SUBMIT_CLASS } from "./platformAccountStyles";

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
    <SectionCard
      title={t("platform.profileChangePassword")}
      icon={Key}
      accentColor="emerald"
    >
      <form onSubmit={(event) => void handleChangePassword(event)} className="space-y-4 text-start">
        {passwordError ? <FieldErrorMessage message={passwordError} /> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <PasswordInput
              id="platform-current-password"
              name="currentPassword"
              label={t("platform.profileCurrentPassword")}
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                if (passwordError) setPasswordError(null);
              }}
            />
          </div>
          <PasswordInput
            id="platform-new-password"
            name="newPassword"
            label={t("platform.profileNewPassword")}
            autoComplete="new-password"
            required
            value={newPassword}
            aria-invalid={Boolean(passwordError)}
            onChange={(event) => {
              setNewPassword(event.target.value);
              if (passwordError) setPasswordError(null);
            }}
          />
          <PasswordInput
            id="platform-confirm-new-password"
            name="confirmPassword"
            label={t("platform.profileConfirmPassword")}
            autoComplete="new-password"
            required
            value={confirmPassword}
            aria-invalid={Boolean(passwordError)}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (passwordError) setPasswordError(null);
            }}
          />
          <PasswordStrengthMeter password={newPassword} className="md:col-span-2" showChecks />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <Button type="submit" className={PLATFORM_PROFILE_SUBMIT_CLASS} disabled={updatePassword.isPending}>
            {updatePassword.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                {t("common.save")}
              </>
            ) : (
              t("platform.profileChangePassword")
            )}
          </Button>
          <Link to={ROUTES.platformForgotPassword} className="inline-flex min-h-11 items-center text-xs text-primary font-bold hover:underline">
            {t("platform.profileForgotLink")}
          </Link>
        </div>
      </form>
    </SectionCard>
  );
}
