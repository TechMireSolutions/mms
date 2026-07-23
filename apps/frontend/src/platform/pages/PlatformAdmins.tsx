import React, { useState } from "react";
import { Loader2, Mail, User, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@mms/shared";
import { Alert } from "@/components/ui/Alert";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import PasswordInput from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { usePlatformAdmins, useAddPlatformAdmin } from "@/platform/hooks/usePlatformAdmins";
import { getPlatformRegisterError } from "@/platform/lib/platformValidation";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { containerVariants, cardVariants } from "@/platform/lib/animations";

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

    const validationError = getPlatformRegisterError(name, email, password, t);
    if (validationError) {
      setSubmitError(validationError);
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
    <PlatformPageShell width="7xl">
      <div className="space-y-8">
        <PageHeader
          title={t("platform.adminsTitle")}
          subtitle={t("platform.adminsSubtitle")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of Admins (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4 text-start">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t("platform.manageAdmins")}
            </h2>

            {loadingAdmins ? (
              <RouteStatusFallback />
            ) : fetchError ? (
              <ErrorState
                title={t("apex.loadError")}
                onRetry={() => void refetch()}
                compact
              />
            ) : admins && admins.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {admins.map((admin) => (
                    <motion.div
                      key={admin.id}
                      variants={cardVariants}
                      layout
                      className="h-full"
                    >
                      <Card
                        accentColor={admin.role === "super_user" ? "primary" : undefined}
                        className="p-6 space-y-3.5 text-start hover:border-primary/20 hover:scale-[1.01] h-full flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-foreground truncate">{admin.name}</p>
                            <StatusBadge
                              status={admin.role}
                              config={{
                                super_user: {
                                  label: t("platform.roleSuperUser"),
                                  cls: "bg-primary/10 text-primary border-primary/20",
                                },
                                admin: {
                                  label: t("platform.roleAdmin"),
                                  cls: "bg-muted text-muted-foreground border-border",
                                },
                              }}
                              size="sm"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                            <span className="truncate">{admin.email}</span>
                          </div>
                        </div>
                        {admin.createdAt ? (
                          <p className="text-[10px] text-muted-foreground/60 font-semibold pt-2 border-t border-border/40 mt-2">
                            {t("platform.profileMemberSince")}: {formatDate(admin.createdAt)}
                          </p>
                        ) : null}
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5">
                <p className="text-sm text-muted-foreground">
                  {t("platform.noAdmins")}
                </p>
              </div>
            )}
          </div>

          {/* Add Admin Form (1/3 width on desktop) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
              {t("platform.addAdmin")}
            </h2>
            <Card accentColor="primary" className="p-0 overflow-hidden">
              <form
                onSubmit={(event) => void handleAddAdmin(event)}
                className="p-6 space-y-4 text-start"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">{t("platform.addAdmin")}</h3>
                </div>

                {submitError ? <Alert message={submitError} /> : null}

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
                      className="ps-9 min-h-[44px]"
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
                      className="ps-9 min-h-[44px]"
                      disabled={addAdmin.isPending}
                    />
                  </div>
                </div>

                <PasswordInput
                  id="admin-password"
                  label={t("platform.adminPassword")}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={addAdmin.isPending}
                />

                <Button type="submit" className="w-full font-bold h-11 rounded-xl cursor-pointer" disabled={addAdmin.isPending}>
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
      </div>
    </PlatformPageShell>
  );
}
