import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, KeyRound, Loader2, Lock } from "lucide-react";
import { DEFAULT_GLOBAL_SETTINGS, validatePasswordPolicy } from "@mms/shared";
import AuthLayout from "@/tenant/components/AuthLayout";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROUTES } from "@/lib/config/routes";
import { apiJson } from "@/lib/apiClient";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_ERROR, FORM_LABEL } from "@/components/ui/formStyles";

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
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <KeyRound className="h-4 w-4 mt-0.5 text-warning" aria-hidden />
            <p>{t("account.forcePasswordBody")}</p>
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-3 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="current-password" className={FORM_LABEL}>{t("account.currentPassword")}</label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="ps-9"
              disabled={busy}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className={FORM_LABEL}>{t("account.newPassword")}</label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="ps-9"
              disabled={busy}
            />
          </div>
          <p className={FORM_ERROR}>{t("account.passwordRulesHint")}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className={FORM_LABEL}>{t("account.confirmPassword")}</label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="ps-9"
              disabled={busy}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-11 font-semibold" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : t("account.forcePasswordSubmit")}
          {!busy ? <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /> : null}
        </Button>
      </form>
    </AuthLayout>
  );
}
