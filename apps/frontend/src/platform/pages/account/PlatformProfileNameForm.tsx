import React, { useEffect, useState } from "react";
import { Loader2, User } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { FieldErrorMessage } from "@/components/ui/FormField";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useUpdatePlatformProfileName } from "@/platform/hooks/usePlatformProfile";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { getPlatformNameError } from "@/platform/lib/platformValidation";
import { notify } from "@/lib/notify";
import { PLATFORM_PROFILE_SUBMIT_CLASS } from "./platformAccountStyles";

export function PlatformProfileNameForm({
  initialName,
}: {
  initialName: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser } = usePlatformAuth();
  const updateName = useUpdatePlatformProfileName();
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleSaveName = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setNameError(null);

    const nameError = getPlatformNameError(name, t);
    if (nameError) {
      setNameError(nameError);
      return;
    }

    try {
      await updateName.mutateAsync(name);
      notify.success(t("platform.profileSaved"));
    } catch (err) {
      setNameError(getPlatformErrorMessage(err, t));
    }
  };

  return (
    <SectionCard
      title={t("platform.profileName")}
      icon={User}
      accentColor="info"
    >
      <form onSubmit={(event) => void handleSaveName(event)} className="space-y-4 text-start">
        {nameError ? <FieldErrorMessage message={nameError} /> : null}
        <div className="space-y-1.5">
          <label htmlFor="platform-profile-name" className={FORM_LABEL}>{t("platform.profileName")}</label>
          <Input
            id="platform-profile-name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-11"
          />
        </div>
        <Button type="submit" className={PLATFORM_PROFILE_SUBMIT_CLASS} disabled={updateName.isPending || name === platformUser?.name}>
          {updateName.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin me-2" aria-hidden />
              {t("common.save")}
            </>
          ) : (
            t("platform.profileSave")
          )}
        </Button>
      </form>
    </SectionCard>
  );
}
