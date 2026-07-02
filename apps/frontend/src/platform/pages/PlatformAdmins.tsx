import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mail,
  User,
  UserPlus,
  Key,
} from "lucide-react";
import {
  PLATFORM_MIN_PASSWORD_LENGTH,
  validatePlatformSetupName,
  validatePlatformSetupPassword,
} from "@mms/shared";
import { PlatformPageShell, PlatformLogoMark } from "@/platform/components/PlatformPageShell";
import { Button } from "@/components/ui/button";
import { FORM_INPUT_ICON, FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { mapPlatformAuthError } from "@/platform/lib/platformAuthErrors";
import { ROUTES } from "@/lib/config/routes";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformAdmins, useAddPlatformAdmin } from "@/platform/hooks/usePlatformAdmins";
import { PlatformLoadingScreen } from "@/platform/components/PlatformLoadingScreen";
import { ApiError } from "@/lib/apiClient";

export default function PlatformAdmins(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    platformUser,
    isPlatformAuthenticated,
    platformAuthChecked,
    isCheckingPlatformAuth,
  } = usePlatformAuth();

  const { data: admins, isLoading: loadingAdmins, isError: fetchError, refetch } = usePlatformAdmins();
  const addAdmin = useAddPlatformAdmin();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!platformAuthChecked || isCheckingPlatformAuth) {
    return <PlatformLoadingScreen />;
  }

  if (!isPlatformAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  if (platformUser?.role !== "super_user") {
    return <Navigate to={ROUTES.home} replace />;
  }

  const handleAddAdmin = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setSubmitError(null);

    const nameKey = validatePlatformSetupName(name);
    if (nameKey) {
      setSubmitError(t(nameKey));
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setSubmitError(t("platform.setupInvalidEmail"));
      return;
    }

    const passwordKey = validatePlatformSetupPassword(password);
    if (passwordKey) {
      setSubmitError(
        passwordKey === "platform.setupPasswordTooShort"
          ? t(passwordKey, { min: String(PLATFORM_MIN_PASSWORD_LENGTH) })
          : t(passwordKey),
      );
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
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? mapPlatformAuthError(error, t) : t("errors.boundary.description"),
      );
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
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          {t("platform.backToConsole")}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* List of Admins */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground tracking-wider uppercase">
              {t("platform.manageAdmins")}
            </h2>

            {loadingAdmins ? (
              <div className="flex justify-center py-8" role="status">
                <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden />
                <span className="sr-only">{t("common.loading")}</span>
              </div>
            ) : fetchError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center space-y-2">
                <p className="text-sm text-destructive">{t("apex.loadError")}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
                  {t("common.retry")}
                </Button>
              </div>
            ) : admins && admins.length > 0 ? (
              <ul className="space-y-3">
                {admins.map((admin) => (
                  <li
                    key={admin.id}
                    className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 space-y-2 text-left transition-all hover:shadow-md hover:border-primary/30 duration-300"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${admin.role === "super_user" ? "bg-primary/45 group-hover:bg-primary" : "bg-muted-foreground/35 group-hover:bg-muted-foreground"} transition-colors duration-300`} />
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
                        {t("platform.profileMemberSince")}: {new Date(admin.createdAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("platform.noAdmins")}
              </p>
            )}
          </div>

          {/* Add Admin Form */}
          <form
            onSubmit={(event) => void handleAddAdmin(event)}
            className="relative overflow-hidden group/form rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 space-y-4 text-left shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/form:bg-primary" />
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" aria-hidden />
              <h2 className="text-sm font-bold text-foreground">{t("platform.addAdmin")}</h2>
            </div>

            {submitError ? (
              <div
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                <span>{submitError}</span>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="admin-name" className={FORM_LABEL}>
                {t("platform.adminName")}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <input
                  id="admin-name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={FORM_INPUT_ICON}
                  disabled={addAdmin.isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-email" className={FORM_LABEL}>
                {t("platform.adminEmail")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={FORM_INPUT_ICON}
                  disabled={addAdmin.isPending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className={FORM_LABEL}>
                {t("platform.adminPassword")}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={PLATFORM_MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={FORM_INPUT_ICON}
                  disabled={addAdmin.isPending}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/75">
                {t("platform.setupPasswordTooShort", { min: String(PLATFORM_MIN_PASSWORD_LENGTH) })}
              </p>
            </div>

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
        </div>
      </div>
    </PlatformPageShell>
  );
}
