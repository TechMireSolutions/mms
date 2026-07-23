import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { useUpdatePlatformProfileName } from "@/platform/hooks/usePlatformProfile";
import { getPlatformErrorMessage } from "@/platform/lib/platformAuthErrors";
import { getPlatformNameError } from "@/platform/lib/platformValidation";
import { notify } from "@/lib/notify";

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
    <>
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
        {t("platform.profileName")}
      </h2>
      
      <Card accentColor="indigo" className="p-0 overflow-hidden">
        <form onSubmit={(event) => void handleSaveName(event)} className="p-6 space-y-4 text-start">
          <h3 className="text-sm font-bold text-foreground">{t("platform.profileName")}</h3>
          {nameError ? <Alert message={nameError} /> : null}
          <div className="space-y-1.5">
            <label htmlFor="platform-profile-name" className={FORM_LABEL}>{t("platform.profileName")}</label>
            <Input
              id="platform-profile-name"
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-[44px]"
            />
          </div>
          <Button type="submit" className="w-fit px-6 font-bold h-10 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={updateName.isPending || name === platformUser?.name}>
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
      </Card>
    </>
  );
}
