import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/FormField";
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
        <Field
          label={t("platform.profileName")}
          required
          error={nameError ?? undefined}
          id="platform-profile-name"
        >
          <Input
            id="platform-profile-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            aria-invalid={Boolean(nameError)}
            onChange={(event) => {
              setName(event.target.value);
              if (nameError) setNameError(null);
            }}
            className="min-h-11"
          />
        </Field>
        <ActionButton
          type="submit"
          variant="primary"
          className={PLATFORM_PROFILE_SUBMIT_CLASS}
          loading={updateName.isPending}
          disabled={name === platformUser?.name}
        >
          {t("platform.profileSave")}
        </ActionButton>
      </form>
    </SectionCard>
  );
}
