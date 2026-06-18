import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Lock, Mail, User } from "lucide-react";
import type { TenantUserProfile } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import PageHeader from "@/components/ui/PageHeader";
import useTranslation from "@/hooks/useTranslation";
import { useTenantProfile, TENANT_PROFILE_KEY } from "@/hooks/useTenantProfile";
import { apiJson, ApiError } from "@/lib/apiClient";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

function contactPrimaryEmail(profile: TenantUserProfile): string {
  const fromList = profile.contact?.emails?.[0]?.address;
  return fromList || (profile.contact?.email as string | undefined) || "";
}

function contactPrimaryPhone(profile: TenantUserProfile): string {
  const phone = profile.contact?.phones?.[0];
  if (!phone) return (profile.contact?.phone as string | undefined) || "";
  return `${phone.countryCode ?? ""}${phone.number}`.trim();
}

export default function AccountProfile(): React.JSX.Element {
  const { t } = useTranslation();
  const { checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, refetch } = useTenantProfile();

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

  useEffect(() => {
    if (!profile) return;
    setName(profile.contact?.name ?? profile.name ?? "");
    setPhone(contactPrimaryPhone(profile));
    setContactEmail(contactPrimaryEmail(profile));
  }, [profile]);

  const loginVerified = useMemo(
    () => Boolean(profile?.emailVerifiedAt),
    [profile?.emailVerifiedAt],
  );

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
        }),
      });
      await queryClient.invalidateQueries({ queryKey: TENANT_PROFILE_KEY });
      await refetch();
      await checkUserAuth({ force: true });
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
      await checkUserAuth({ force: true });
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

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={t("account.title")}
        subtitle={t("account.subtitle")}
        icon={User}
      />

      {isLoading ? (
        <div className="flex justify-center py-16" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : profile ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("account.contactSection")}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t("account.contactSectionDesc")}</p>
            </div>
            {!profile.contact ? (
              <p className="text-sm text-muted-foreground">{t("account.noContact")}</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label htmlFor="profile-name" className={FORM_LABEL}>{t("account.fieldName")}</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={FORM_INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="profile-phone" className={FORM_LABEL}>{t("account.fieldPhone")}</label>
                  <input
                    id="profile-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={FORM_INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="profile-contact-email" className={FORM_LABEL}>{t("account.contactEmail")}</label>
                  <input
                    id="profile-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={FORM_INPUT}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">{t("account.contactEmailHint")}</p>
                </div>
                <Button type="button" onClick={() => void handleSaveContact()} disabled={savingContact}>
                  {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.saveContact")}
                </Button>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t("account.loginSection")}</h2>
                <p className="text-xs text-muted-foreground mt-1">{t("account.loginSectionDesc")}</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{t("account.loginEmail")}:</span>
                <span className="font-medium text-foreground">{profile.loginEmail}</span>
              </div>
              {loginVerified ? (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("account.emailVerified")}
                </p>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">{t("account.emailNotVerified")}</p>
              )}
              {profile.pendingLoginEmail ? (
                <p className="text-xs text-muted-foreground">
                  {t("account.pendingLoginEmail", { email: profile.pendingLoginEmail })}
                </p>
              ) : null}
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground">{t("account.changeLoginEmail")}</p>
                <div>
                  <label htmlFor="new-login-email" className={FORM_LABEL}>{t("account.newLoginEmail")}</label>
                  <input
                    id="new-login-email"
                    type="email"
                    value={newLoginEmail}
                    onChange={(e) => setNewLoginEmail(e.target.value)}
                    className={FORM_INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="login-email-password" className={FORM_LABEL}>{t("account.currentPassword")}</label>
                  <input
                    id="login-email-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={FORM_INPUT}
                  />
                </div>
                {!challengeId ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loginEmailBusy || !newLoginEmail.trim() || !loginPassword}
                    onClick={() => void handleRequestLoginEmail()}
                  >
                    {loginEmailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.sendCode")}
                  </Button>
                ) : (
                  <>
                    {devCode ? (
                      <p className="text-xs text-muted-foreground">
                        {t("account.devCodeHint", { code: devCode })}
                      </p>
                    ) : null}
                    <div>
                      <label htmlFor="login-email-code" className={FORM_LABEL}>{t("account.verificationCode")}</label>
                      <input
                        id="login-email-code"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        className={FORM_INPUT}
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={loginEmailBusy || !verifyCode.trim()}
                      onClick={() => void handleConfirmLoginEmail()}
                    >
                      {loginEmailBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("account.confirmLoginEmail")
                      )}
                    </Button>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">{t("account.changePassword")}</h2>
              </div>
              <div>
                <label htmlFor="current-password" className={FORM_LABEL}>{t("account.currentPassword")}</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={FORM_INPUT}
                />
              </div>
              <div>
                <label htmlFor="new-password" className={FORM_LABEL}>{t("account.newPassword")}</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={FORM_INPUT}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className={FORM_LABEL}>{t("account.confirmPassword")}</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={FORM_INPUT}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={passwordBusy || !currentPassword || !newPassword}
                onClick={() => void handleChangePassword()}
              >
                {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.changePassword")}
              </Button>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
