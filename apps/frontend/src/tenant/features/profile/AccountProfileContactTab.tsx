import type React from "react";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { normalizePhoneInput, type TenantUserProfile } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/useTranslation";

export interface AccountProfileContactTabProps {
  profile: TenantUserProfile;
  name: string;
  phone: string;
  contactEmail: string;
  savingContact: boolean;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onSaveContact: () => Promise<void>;
}

export function AccountProfileContactTab({
  profile,
  name,
  phone,
  contactEmail,
  savingContact,
  onNameChange,
  onPhoneChange,
  onContactEmailChange,
  onSaveContact,
}: AccountProfileContactTabProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Card className="relative overflow-hidden group/profile-card shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
      <div className="absolute start-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/profile-card:bg-primary" />
      <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 ps-6.5">
        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
          <User className="h-4 w-4 text-primary shrink-0" />
          {t("account.contactSection")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          {t("account.contactSectionDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4 ps-6.5">
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
              void onSaveContact();
            }}
            className="space-y-4"
          >
            <div className="space-y-1 text-start">
              <Label htmlFor="profile-name" className="text-xs font-semibold text-muted-foreground">{t("account.fieldName")}</Label>
              <Input
                id="profile-name"
                name="profileName"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                required
                autoComplete="name"
                className="min-h-11"
              />
            </div>
            <div className="space-y-1 text-start">
              <Label htmlFor="profile-phone" className="text-xs font-semibold text-muted-foreground">{t("account.fieldPhone")}</Label>
              <Input
                id="profile-phone"
                name="profilePhone"
                type="tel"
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value)}
                onBlur={() => onPhoneChange(normalizePhoneInput(phone))}
                required
                autoComplete="tel"
                className="min-h-11"
              />
            </div>
            <div className="space-y-1 text-start">
              <Label htmlFor="profile-contact-email" className="text-xs font-semibold text-muted-foreground">{t("account.contactEmail")}</Label>
              <Input
                id="profile-contact-email"
                name="profileContactEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => onContactEmailChange(event.target.value)}
                required
                autoComplete="email"
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("account.contactEmailHint")}</p>
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={savingContact} className="w-full sm:w-auto min-h-11 px-6">
                {savingContact ? <Loader2 className="h-4 w-4 animate-spin" /> : t("account.saveContact")}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
