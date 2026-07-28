import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_GLOBAL_SETTINGS, validatePasswordPolicy } from "@mms/shared";
import PasswordInput from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import AuthLayout from "@/tenant/components/AuthLayout";
import EntryPageHead, { formatEntryTitle } from "@/components/entry/EntryPageHead";
import { AuthSubmitButton } from "@/components/entry/AuthFormControls";
import { AuthStatusBanner } from "@/components/entry/AuthStatusBanner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROUTES } from "@/lib/config/routes";
import { apiJson } from "@/lib/apiClient";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForcePasswordChange(): React.ReactElement {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("auth.passwordRequired"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("account.passwordMismatch"));
      return;
    }
    const policy = validatePasswordPolicy(newPassword, DEFAULT_GLOBAL_SETTINGS.passwordPolicy);
    if (!policy.valid) {
      setError(policy.errorKey ? t(policy.errorKey) : policy.message);
      return;
    }

    setBusy(true);
    try {
      await apiJson<{ success: true; requiresSignIn?: boolean }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      logout(false);
      navigate(ROUTES.login, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("account.wrongPassword"));
    } finally {
      setBusy(false);
    }
  };

  const pageTitle = formatEntryTitle(t("account.forcePasswordTitle"), t("entry.productName"));

  return (
    <>
      <EntryPageHead title={pageTitle} description={t("account.forcePasswordBody")} />
      <AuthLayout title={t("account.forcePasswordTitle")}>
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate aria-busy={busy}>
          <Alert variant="warning" message={t("account.forcePasswordBody")} />
          {error ? <AuthStatusBanner message={error} /> : null}

          <fieldset disabled={busy} className="m-0 min-w-0 space-y-4 border-0 p-0">
            <PasswordInput
              id="current-password"
              label={t("account.currentPassword")}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="h-11"
            />

            <div className="space-y-1.5">
              <PasswordInput
                id="new-password"
                label={t("account.newPassword")}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="h-11"
                aria-describedby="password-rules-hint"
              />
              <p id="password-rules-hint" className="text-xs leading-relaxed text-muted-foreground">
                {t("account.passwordRulesHint")}
              </p>
            </div>

            <PasswordInput
              id="confirm-password"
              label={t("account.confirmPassword")}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11"
            />

            <AuthSubmitButton
              busy={busy}
              busyLabel={t("common.loading")}
              label={t("account.forcePasswordSubmit")}
            />
          </fieldset>
        </form>
      </AuthLayout>
    </>
  );
}
