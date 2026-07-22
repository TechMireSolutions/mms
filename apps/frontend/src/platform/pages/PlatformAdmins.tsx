import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { formatDate } from "@mms/shared";
import { PlatformAlert } from "@/platform/components/PlatformAlert";
import { PlatformPageShell, PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import PlatformPasswordInput from "@/platform/components/PlatformPasswordInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAdmins, useAddPlatformAdmin } from "@/platform/hooks/usePlatformAdmins";
import {
  getPlatformEmailError,
  getPlatformNameError,
  getPlatformPasswordError,
} from "@/platform/lib/platformValidation";
import PlatformSpinner from "@/platform/components/PlatformSpinner";
import PlatformRetryBlock from "@/platform/components/PlatformRetryBlock";

export default function PlatformAdmins(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: admins, isLoading: loadingAdmins, isError: fetchError, refetch } = usePlatformAdmins();
  const addAdmin = useAddPlatformAdmin();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAddAdmin = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    const nameError = getPlatformNameError(name, t);
    if (nameError) {
      setSubmitError(nameError);
      return;
    }

    const emailError = getPlatformEmailError(email, t);
    if (emailError) {
      setSubmitError(emailError);
      return;
    }

    const passwordError = getPlatformPasswordError(password, t);
    if (passwordError) {
      setSubmitError(passwordError);
      return;
    }

    try {
      await addAdmin.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setSubmitError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <PlatformPageShell width="lg">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <PlatformLogoMark />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("platform.adminsTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("platform.adminsSubtitle")}</p>
          </div>
        </div>

        <Link
          to={ROUTES.home}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden />
          {t("platform.backToConsole")}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* List of Admins */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              {t("platform.manageAdmins")}
            </h2>

            {loadingAdmins ? (
              <PlatformSpinner label={t("common.loading")} />
            ) : fetchError ? (
              <PlatformRetryBlock
                errorText={t("apex.loadError")}
                retryText={t("common.retry")}
                onRetry={() => void refetch()}
              />
            ) : admins && admins.length > 0 ? (
              <div className="space-y-3">
                {admins.map((admin) => (
                  <Card
                    key={admin.id}
                    accentColor={admin.role === "super_user" ? "primary" : undefined}
                    className="p-5 ps-6.5 space-y-2 text-start hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{admin.name}</p>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                          admin.role === "super_user"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {admin.role === "super_user"
                          ? t("platform.roleSuperUser")
                          : t("platform.roleAdmin")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.createdAt ? (
                      <p className="text-[10px] text-muted-foreground/70">
                        {t("platform.profileMemberSince")}: {formatDate(admin.createdAt)}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("platform.noAdmins")}
              </p>
            )}
          </div>

          {/* Add Admin Form */}
          <Card accentColor="primary" className="p-0">
            <form
              onSubmit={(event) => void handleAddAdmin(event)}
              className="p-5 ps-6.5 space-y-4 text-start"
            >
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" aria-hidden />
              <h2 className="text-sm font-bold text-foreground">{t("platform.addAdmin")}</h2>
            </div>

            {submitError ? <PlatformAlert message={submitError} /> : null}

            <div className="space-y-1.5">
              <label htmlFor="admin-name" className={FORM_LABEL}>
                {t("platform.adminName")}
              </label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <Input
                  id="admin-name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="ps-9"
                  disabled={addAdmin.isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className={FORM_LABEL}>
                {t("platform.adminEmail")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <Input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="ps-9"
                  disabled={addAdmin.isPending}
                />
              </div>
            </div>

            <PlatformPasswordInput
              id="admin-password"
              label={t("platform.adminPassword")}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={addAdmin.isPending}
            />

            <Button type="submit" className="w-full font-semibold" disabled={addAdmin.isPending}>
              {addAdmin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
                  {t("platform.createAdminPending")}
                </>
              ) : (
                t("platform.addAdmin")
              )}
            </Button>
            </form>
          </Card>
        </div>
      </div>
    </PlatformPageShell>
  );
}
