import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { DEFAULT_GLOBAL_SETTINGS, validatePasswordPolicy } from "@mms/shared";
import AuthLayout from "@/tenant/components/AuthLayout";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROUTES } from "@/lib/config/routes";
import { apiJson } from "@/lib/apiClient";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { FORM_ERROR } from "@/components/ui/formStyles";

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

  return (
    <AuthLayout title={t("account.forcePasswordTitle")}>
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        <Alert
          variant="warning"
          message={t("account.forcePasswordBody")}
        />

        {error ? <Alert message={error} /> : null}

        <PasswordInput
          id="current-password"
          label={t("account.currentPassword")}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          disabled={busy}
        />

        <div className="space-y-1">
          <PasswordInput
            id="new-password"
            label={t("account.newPassword")}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={busy}
          />
          <p className={FORM_ERROR}>{t("account.passwordRulesHint")}</p>
        </div>

        <PasswordInput
          id="confirm-password"
          label={t("account.confirmPassword")}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={busy}
        />

        <Button type="submit" className="w-full h-11 font-semibold" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t("account.forcePasswordSubmit")}
          {!busy ? <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /> : null}
        </Button>
      </form>
    </AuthLayout>
  );
}
