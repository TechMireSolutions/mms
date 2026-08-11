import type React from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import type { TenantUserProfile } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardTitleBar } from "@/components/ui/CardTitleBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";

export interface AccountProfileLoginEmailCardProps {
  profile: TenantUserProfile;
  loginVerified: boolean;
  newLoginEmail: string;
  loginPassword: string;
  challengeId: string | null;
  verifyCode: string;
  devCode: string | null;
  loginEmailBusy: boolean;
  showEmailForm: boolean;
  onNewLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onVerifyCodeChange: (value: string) => void;
  onShowEmailForm: () => void;
  onCancelLoginEmailRequest: () => void;
  onCancelLoginEmailConfirm: () => void;
  onRequestLoginEmail: () => Promise<void>;
  onConfirmLoginEmail: () => Promise<void>;
}

export function AccountProfileLoginEmailCard({
  profile,
  loginVerified,
  newLoginEmail,
  loginPassword,
  challengeId,
  verifyCode,
  devCode,
  loginEmailBusy,
  showEmailForm,
  onNewLoginEmailChange,
  onLoginPasswordChange,
  onVerifyCodeChange,
  onShowEmailForm,
  onCancelLoginEmailRequest,
  onCancelLoginEmailConfirm,
  onRequestLoginEmail,
  onConfirmLoginEmail,
}: AccountProfileLoginEmailCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="group/login-card">
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/login-card:bg-primary" />
      <CardTitleBar
        inset
        icon={<Mail className="h-4 w-4 text-primary" />}
        title={t("account.loginSection")}
        subtitle={t("account.loginSectionDesc")}
      />
      <CardContent className="pt-5 space-y-4 ps-6.5">
        <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-xl text-sm">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-start">
            <p className="text-xs text-muted-foreground font-medium">{t("account.loginEmail")}</p>
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
              <Button type="button" variant="outline" onClick={onShowEmailForm} className="w-full min-h-11">
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
                    void onRequestLoginEmail();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1 text-start">
                    <Label htmlFor="new-login-email" className="text-xs font-semibold text-muted-foreground">{t("account.newLoginEmail")}</Label>
                    <Input
                      id="new-login-email"
                      type="email"
                      value={newLoginEmail}
                      onChange={(event) => onNewLoginEmailChange(event.target.value)}
                      required
                      autoComplete="email"
                      className="min-h-11"
                    />
                  </div>
                  <div className="space-y-1 text-start">
                    <Label htmlFor="login-email-password" className="text-xs font-semibold text-muted-foreground">{t("account.currentPassword")}</Label>
                    <Input
                      id="login-email-password"
                      type="password"
                      value={loginPassword}
                      onChange={(event) => onLoginPasswordChange(event.target.value)}
                      required
                      autoComplete="current-password"
                      className="min-h-11"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={loginEmailBusy || !newLoginEmail.trim() || !loginPassword}
                      className="w-full sm:w-auto min-h-11"
                    >
                      {loginEmailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.sendCode")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onCancelLoginEmailRequest}
                      disabled={loginEmailBusy}
                      className="w-full sm:w-auto min-h-11"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onConfirmLoginEmail();
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
                      onChange={(event) => onVerifyCodeChange(event.target.value)}
                      required
                      autoComplete="one-time-code"
                      className="min-h-11"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="submit"
                      disabled={loginEmailBusy || !verifyCode.trim()}
                      className="flex-1 sm:flex-none min-h-11"
                    >
                      {loginEmailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.confirmLoginEmail")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onCancelLoginEmailConfirm}
                      disabled={loginEmailBusy}
                      className="flex-1 sm:flex-none min-h-11"
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
  );
}
