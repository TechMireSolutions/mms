import React, { useEffect, useMemo, useState, useRef } from "react";
import { CheckCircle2, Loader2, Lock, Mail, User, Camera, ShieldCheck } from "lucide-react";
import type { TenantUserProfile } from "@mms/shared";
import { calculateProfileCompleteness, getInitials } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function contactPrimaryEmail(profile: TenantUserProfile): string {
  const fromList = profile.contact?.emails?.[0]?.address;
  return fromList || (profile.contact?.email as string | undefined) || "";
}

function contactPrimaryPhone(profile: TenantUserProfile): string {
  const phone = profile.contact?.phones?.[0];
  if (!phone) return (profile.contact?.phone as string | undefined) || "";
  return `${phone.countryCode ?? ""}${phone.number}`.trim();
}

interface PasswordStrengthResult {
  score: number;
  colorClass: string;
  key: "account.passwordStrengthVeryWeak" | "account.passwordStrengthWeak" | "account.passwordStrengthMedium" | "account.passwordStrengthStrong" | "account.passwordStrengthVeryStrong" | null;
}

function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, colorClass: "bg-muted", key: null };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, colorClass: "bg-destructive", key: "account.passwordStrengthVeryWeak" };
  } else if (score === 2) {
    return { score, colorClass: "bg-destructive/80", key: "account.passwordStrengthWeak" };
  } else if (score === 3) {
    return { score, colorClass: "bg-warning", key: "account.passwordStrengthMedium" };
  } else if (score === 4) {
    return { score, colorClass: "bg-success/80", key: "account.passwordStrengthStrong" };
  } else {
    return { score, colorClass: "bg-success", key: "account.passwordStrengthVeryStrong" };
  }
}

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
    setPhone(contactPrimaryPhone(profile));
    setContactEmail(contactPrimaryEmail(profile));
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
          {/* Header Summary Card */}
          <Card className="overflow-hidden border-border bg-gradient-to-r from-card via-card/90 to-background/50 backdrop-blur-md shadow-md rounded-xl">
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-start">
                {/* Avatar Section */}
                <div className="relative group/avatar">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => profile.contact && fileInputRef.current?.click()}
                    disabled={!profile.contact}
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-extrabold text-2xl shadow-md border-4 border-card relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 transform hover:scale-[1.04] active:scale-[0.98] ${profile.contact ? "cursor-pointer group" : ""}`}
                    aria-label={t("account.changePhoto")}
                  >
                    {profile.contact?.avatar ? (
                      <img
                        src={profile.contact.avatar}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <span>{profile.contact?.name ? getInitials(profile.contact.name) : getInitials(profile.name || "U")}</span>
                    )}

                    {profile.contact && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-full backdrop-blur-[1px]">
                        <Camera className="w-6 h-6 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Name & Role details */}
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-foreground tracking-tight">{name || profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                      {profile.role}
                    </span>
                    <span className="text-xs text-muted-foreground">{profile.loginEmail}</span>
                  </div>
                </div>
              </div>

              {/* Profile Completeness meter */}
              {profile.contact && (
                <div className="w-full md:w-64 space-y-2 text-start">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">{t("account.completeness")}</span>
                    <span className="text-primary">{completeness}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-info transition-all duration-500 ease-out"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-muted/60 p-1 border border-border/40 backdrop-blur-sm rounded-xl">
              <TabsTrigger
                value="profile"
                className="flex items-center justify-center gap-2 rounded-lg py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-300 font-semibold"
              >
                <User className="h-4 w-4 shrink-0" />
                {t("account.contactSection")}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center justify-center gap-2 rounded-lg py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-300 font-semibold"
              >
                <Lock className="h-4 w-4 shrink-0" />
                {t("account.loginSection")}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="profile"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 focus-visible:outline-none"
            >
              <Card className="relative overflow-hidden group/profile-card shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
                <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/profile-card:bg-primary" />
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 pl-6.5">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary shrink-0" />
                    {t("account.contactSection")}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    {t("account.contactSectionDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4 pl-6.5">
                  {!profile.contact ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning-foreground animate-in fade-in-50 duration-200">
                      <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-warning" />
                      <div className="space-y-1 text-start">
                        <h4 className="text-sm font-semibold">{t("account.unlinkedTitle")}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t("account.noContact")}</p>
                      </div>
                    </div>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveContact();
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1 text-start">
                        <Label htmlFor="profile-name" className="text-xs font-semibold text-muted-foreground">{t("account.fieldName")}</Label>
                        <Input
                          id="profile-name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          required
                          autoComplete="name"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1 text-start">
                        <Label htmlFor="profile-phone" className="text-xs font-semibold text-muted-foreground">{t("account.fieldPhone")}</Label>
                        <Input
                          id="profile-phone"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          required
                          autoComplete="tel"
                          className="min-h-[44px]"
                        />
                      </div>
                      <div className="space-y-1 text-start">
                        <Label htmlFor="profile-contact-email" className="text-xs font-semibold text-muted-foreground">{t("account.contactEmail")}</Label>
                        <Input
                          id="profile-contact-email"
                          type="email"
                          value={contactEmail}
                          onChange={(event) => setContactEmail(event.target.value)}
                          required
                          autoComplete="email"
                          className="min-h-[44px]"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">{t("account.contactEmailHint")}</p>
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={savingContact} className="w-full sm:w-auto min-h-[44px] px-6">
                          {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.saveContact")}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="security"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300 focus-visible:outline-none"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="relative overflow-hidden group/login-card shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
                  <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-indigo-500/45 transition-colors group-hover/login-card:bg-indigo-500" />
                  <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 pl-6.5">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      {t("account.loginSection")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {t("account.loginSectionDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 pl-6.5">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-xl text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-start">
                        <p className="text-[11px] text-muted-foreground font-medium">{t("account.loginEmail")}</p>
                        <p className="font-semibold text-foreground mt-0.5">{profile.loginEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      {loginVerified ? (
                        <p className="flex items-center gap-1.5 text-xs text-success font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          {t("account.emailVerified")}
                        </p>
                      ) : (
                        <p className="text-xs text-warning font-semibold">{t("account.emailNotVerified")}</p>
                      )}
                    </div>

                    {profile.pendingLoginEmail ? (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/55">
                        {t("account.pendingLoginEmail", { email: profile.pendingLoginEmail })}
                      </p>
                    ) : null}

                    <div className="space-y-4 border-t border-border pt-4 mt-2">
                      {!showEmailForm && !challengeId ? (
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEmailForm(true)}
                            className="w-full min-h-[44px]"
                          >
                            {t("account.changeLoginEmail")}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-foreground mb-1">{t("account.changeLoginEmail")}</p>
                          {!challengeId ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleRequestLoginEmail();
                              }}
                              className="space-y-4"
                            >
                              <div className="space-y-1 text-start">
                                <Label htmlFor="new-login-email" className="text-xs font-semibold text-muted-foreground">{t("account.newLoginEmail")}</Label>
                                <Input
                                  id="new-login-email"
                                  type="email"
                                  value={newLoginEmail}
                                  onChange={(event) => setNewLoginEmail(event.target.value)}
                                  required
                                  autoComplete="email"
                                  className="min-h-[44px]"
                                />
                              </div>
                              <div className="space-y-1 text-start">
                                <Label htmlFor="login-email-password" className="text-xs font-semibold text-muted-foreground">{t("account.currentPassword")}</Label>
                                <Input
                                  id="login-email-password"
                                  type="password"
                                  value={loginPassword}
                                  onChange={(event) => setLoginPassword(event.target.value)}
                                  required
                                  autoComplete="current-password"
                                  className="min-h-[44px]"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  type="submit"
                                  variant="outline"
                                  disabled={loginEmailBusy || !newLoginEmail.trim() || !loginPassword}
                                  className="w-full sm:w-auto min-h-[44px]"
                                >
                                  {loginEmailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.sendCode")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowEmailForm(false);
                                    setNewLoginEmail("");
                                    setLoginPassword("");
                                  }}
                                  disabled={loginEmailBusy}
                                  className="w-full sm:w-auto min-h-[44px]"
                                >
                                  {t("common.cancel")}
                                </Button>
                              </div>
                            </form>
                          ) : (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault();
                                void handleConfirmLoginEmail();
                              }}
                              className="space-y-4 pt-2"
                            >
                              {devCode ? (
                                <p className="text-xs text-muted-foreground bg-info/10 text-info p-2 rounded border border-info/20">
                                  {t("account.devCodeHint", { code: devCode })}
                                </p>
                              ) : null}
                              <div className="space-y-1 text-start">
                                <Label htmlFor="login-email-code" className="text-xs font-semibold text-muted-foreground">{t("account.verificationCode")}</Label>
                                <Input
                                  id="login-email-code"
                                  value={verifyCode}
                                  onChange={(event) => setVerifyCode(event.target.value)}
                                  required
                                  autoComplete="one-time-code"
                                  className="min-h-[44px]"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  type="submit"
                                  disabled={loginEmailBusy || !verifyCode.trim()}
                                  className="flex-1 sm:flex-none min-h-[44px]"
                                >
                                  {loginEmailBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    t("account.confirmLoginEmail")
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => {
                                    setShowEmailForm(false);
                                    setNewLoginEmail("");
                                    setLoginPassword("");
                                    setChallengeId(null);
                                    setVerifyCode("");
                                  }}
                                  disabled={loginEmailBusy}
                                  className="flex-1 sm:flex-none min-h-[44px]"
                                >
                                  {t("common.cancel")}
                                </Button>
                              </div>
                            </form>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden group/password-card shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
                  <div className="absolute inset-inline-start-0 top-0 bottom-0 w-1 bg-emerald-500/45 transition-colors group-hover/password-card:bg-emerald-500" />
                  <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 pl-6.5">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary shrink-0" />
                      {t("account.changePassword")}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      {t("account.changePassword")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4 pl-6.5">
                    {!showPasswordForm ? (
                      <div className="pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordForm(true)}
                          className="w-full min-h-[44px]"
                        >
                          {t("account.changePassword")}
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleChangePassword();
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1 text-start">
                          <Label htmlFor="current-password" className="text-xs font-semibold text-muted-foreground">{t("account.currentPassword")}</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            required
                            autoComplete="current-password"
                            className="min-h-[44px]"
                          />
                        </div>
                        <div className="space-y-1 text-start">
                          <Label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground">{t("account.newPassword")}</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            required
                            autoComplete="new-password"
                            className="min-h-[44px]"
                          />
                          
                          <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground text-[11px] leading-snug">
                                {t("account.passwordRulesHint")}
                              </span>
                              {newPassword && passwordStrength.key && (
                                <span className="font-semibold text-foreground shrink-0">
                                  {t(passwordStrength.key)}
                                </span>
                              )}
                            </div>
                            {newPassword && (
                              <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full mt-1.5">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div
                                    key={level}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      passwordStrength.score >= level
                                        ? passwordStrength.colorClass
                                        : "bg-muted"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1 text-start">
                          <Label htmlFor="confirm-password" className="text-xs font-semibold text-muted-foreground">{t("account.confirmPassword")}</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            autoComplete="new-password"
                            className="min-h-[44px]"
                          />
                          {newPassword && confirmPassword && (
                            <p className={`text-xs mt-1 font-medium ${newPassword === confirmPassword ? "text-success" : "text-destructive"}`}>
                              {newPassword === confirmPassword ? t("account.passwordSecure") || "Passwords match" : t("account.passwordMismatch")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button
                            type="submit"
                            variant="outline"
                            disabled={passwordBusy || !currentPassword || !newPassword || newPassword !== confirmPassword}
                            className="w-full sm:w-auto min-h-[44px]"
                          >
                            {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.changePassword")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setCurrentPassword("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                            disabled={passwordBusy}
                            className="w-full sm:w-auto min-h-[44px]"
                          >
                            {t("common.cancel")}
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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
