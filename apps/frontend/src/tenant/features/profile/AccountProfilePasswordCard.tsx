import type React from "react";
import { Loader2, Lock } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { useTranslation } from "@/hooks/useTranslation";
import type { PasswordStrengthResult } from "./passwordStrength";

export interface AccountProfilePasswordCardProps {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordBusy: boolean;
  showPasswordForm: boolean;
  passwordStrength: PasswordStrengthResult;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordForm: () => void;
  onCancelPasswordChange: () => void;
  onChangePassword: () => Promise<void>;
}

export function AccountProfilePasswordCard({
  currentPassword,
  newPassword,
  confirmPassword,
  passwordBusy,
  showPasswordForm,
  passwordStrength,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordForm,
  onCancelPasswordChange,
  onChangePassword,
}: AccountProfilePasswordCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="relative overflow-hidden group/password-card shadow-md">
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-success/45 transition-colors group-hover/password-card:bg-success" />
      <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 ps-6.5">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary shrink-0" />
          {t("account.changePassword")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {t("account.changePassword")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 ps-6.5">
        {!showPasswordForm ? (
          <div className="pt-1">
            <Button type="button" variant="outline" onClick={onShowPasswordForm} className="w-full min-h-11">
              {t("account.changePassword")}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void onChangePassword();
            }}
            className="space-y-4"
          >
            <PasswordInput
              id="current-password"
              label={t("account.currentPassword")}
              value={currentPassword}
              onChange={(event) => onCurrentPasswordChange(event.target.value)}
              required
              autoComplete="current-password"
              className="min-h-11"
            />
            <div className="space-y-1">
              <PasswordInput
                id="new-password"
                label={t("account.newPassword")}
                value={newPassword}
                onChange={(event) => onNewPasswordChange(event.target.value)}
                required
                autoComplete="new-password"
                className="min-h-11"
              />

              <div className="space-y-2 mt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 text-xs leading-snug text-muted-foreground">
                    {t("account.passwordRulesHint")}
                  </span>
                  {newPassword && passwordStrength.key && (
                    <span className="shrink-0 font-semibold text-foreground">
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
                          passwordStrength.score >= level ? passwordStrength.colorClass : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <PasswordInput
                id="confirm-password"
                label={t("account.confirmPassword")}
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                required
                autoComplete="new-password"
                className="min-h-11"
              />
              {newPassword && confirmPassword && newPassword === confirmPassword ? (
                <p className="text-xs mt-1 font-medium text-success">
                  {t("account.passwordSecure")}
                </p>
              ) : null}
              {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                <FieldErrorMessage message={t("account.passwordMismatch")} />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                disabled={passwordBusy || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full sm:w-auto min-h-11"
              >
                {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.changePassword")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onCancelPasswordChange}
                disabled={passwordBusy}
                className="w-full sm:w-auto min-h-11"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
