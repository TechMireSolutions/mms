import React from "react";
import { ArrowUpRight, Globe, IdCard, Mail, MapPin, MessageSquare, Phone, ShieldCheck, Tag } from "lucide-react";
import type { Address, EmailAddress, PhoneNumber, StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";
import { toMessagingRecipient } from "@mms/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailSectionTitle } from "@/components/ui/DetailSectionTitle";
import { EntityMessagingIconActions } from "@/components/ui/EntityMessagingIconActions";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { MESSAGING_ICON_BTN, MESSAGING_ICON_BTN_TONES } from "@/components/ui/messagingActionStyles";

export interface StudentContactProfileData {
  contactId?: string;
  displayName: string;
  phones: PhoneNumber[];
  emails: EmailAddress[];
  addresses: Address[];
  cnic?: string;
  isSyed?: boolean;
  preferredLanguage?: string;
  preferredContactMethod?: string;
  tags?: string[];
}

interface StudentDetailContactSectionProps {
  contactProfile: StudentContactProfileData;
  canMessage?: boolean;
  openComposer?: (channel: "sms" | "whatsapp" | "email", recipients: MessagingRecipient[]) => void;
  onNavigateToContact?: (contactId: string | number) => void;
}

export function StudentDetailContactSection({
  contactProfile,
  canMessage = true,
  openComposer,
  onNavigateToContact,
}: StudentDetailContactSectionProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const {
    contactId,
    displayName,
    phones,
    emails,
    addresses,
    cnic,
    isSyed,
    preferredLanguage,
    preferredContactMethod,
    tags = [],
  } = contactProfile;

  const hasAnyContactData =
    phones.length > 0 ||
    emails.length > 0 ||
    addresses.length > 0 ||
    Boolean(cnic) ||
    Boolean(isSyed) ||
    Boolean(preferredLanguage) ||
    Boolean(preferredContactMethod) ||
    tags.length > 0;

  if (!hasAnyContactData && !contactId) return null;

  const handleWhatsApp = (phoneNum: string) => {
    if (!canMessage || !openComposer || !phoneNum) return;
    openComposer("whatsapp", [
      toMessagingRecipient({
        id: contactId || `student-contact`,
        name: displayName,
        phone: phoneNum,
      }),
    ]);
  };

  const handleSms = (phoneNum: string) => {
    if (!canMessage || !openComposer || !phoneNum) return;
    openComposer("sms", [
      toMessagingRecipient({
        id: contactId || `student-contact`,
        name: displayName,
        phone: phoneNum,
      }),
    ]);
  };

  const handleEmail = (emailAddress: string) => {
    if (!canMessage || !openComposer || !emailAddress) return;
    openComposer("email", [
      toMessagingRecipient({
        id: contactId || `student-contact`,
        name: displayName,
        email: emailAddress,
      }),
    ]);
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <DetailSectionTitle>{t("students.detail.contactProfile")}</DetailSectionTitle>
        {contactId && onNavigateToContact && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToContact(contactId)}
            className={cn(
              MESSAGING_ICON_BTN,
              MESSAGING_ICON_BTN_TONES.link,
              "h-7 px-2 text-xs gap-1 font-medium",
            )}
            title={t("students.detail.viewInContacts")}
          >
            <span>{t("students.detail.viewInContacts")}</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </Button>
        )}
      </div>

      <Card accentColor="primary" className="p-3.5 space-y-3">
        {phones.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("students.detail.phonesLabel")}
            </span>
            {phones.map((phone, idx) => (
              <div
                key={`student-phone-${phone.number}-${idx}`}
                className="flex items-center justify-between gap-2 py-1 px-2.5 rounded-lg bg-muted/40 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                  <span className="font-mono text-foreground truncate">{phone.number}</span>
                  {phone.label && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      {phone.label}
                    </span>
                  )}
                  {phone.isPrimary && (
                    <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
                      ★ {t("theme.tokenPrimary")}
                    </span>
                  )}
                </div>
                {canMessage && (
                  <EntityMessagingIconActions
                    primaryPhone={phone.number}
                    labels={{
                      call: t("students.detail.call"),
                      whatsapp: t("students.list.actionWhatsApp"),
                      sms: t("students.list.actionSms"),
                    }}
                    callAriaLabel={t("students.detail.callPhone", { phone: phone.number })}
                    whatsappAriaLabel={t("students.list.actionWhatsApp")}
                    smsAriaLabel={t("students.list.actionSms")}
                    onWhatsApp={() => handleWhatsApp(phone.number)}
                    onSms={() => handleSms(phone.number)}
                    className="shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {emails.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("students.detail.emailsLabel")}
            </span>
            {emails.map((email, idx) => (
              <div
                key={`student-email-${email.address}-${idx}`}
                className="flex items-center justify-between gap-2 py-1 px-2.5 rounded-lg bg-muted/40 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                  <span className="text-foreground truncate">{email.address}</span>
                  {email.label && (
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                      {email.label}
                    </span>
                  )}
                  {email.isPrimary && (
                    <span className="text-[10px] text-primary font-bold uppercase tracking-tight">
                      ★ {t("theme.tokenPrimary")}
                    </span>
                  )}
                </div>
                {canMessage && openComposer && (
                  <EntityMessagingIconActions
                    primaryEmail={email.address}
                    labels={{ email: t("students.list.actionEmail") }}
                    emailAriaLabel={t("students.list.actionEmail")}
                    onEmail={() => handleEmail(email.address)}
                    className="shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {addresses.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              {t("students.detail.addressesLabel")}
            </span>
            {addresses.map((addr, idx) => {
              const formatted = [addr.line1, addr.city, addr.state, addr.country]
                .filter(Boolean)
                .join(", ");
              if (!formatted) return null;
              return (
                <div
                  key={`student-addr-${idx}`}
                  className="flex items-start gap-2 py-1 px-2.5 rounded-lg bg-muted/30 text-xs text-muted-foreground"
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                  <span className="truncate flex-1">{formatted}</span>
                  {addr.label && (
                    <span className="text-[10px] uppercase tracking-tight font-medium shrink-0">
                      {addr.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(cnic || isSyed || preferredLanguage || preferredContactMethod || tags.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
            {cnic && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IdCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                <span className="font-medium text-foreground">{cnic}</span>
              </div>
            )}
            {isSyed && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" aria-hidden />
                <span className="font-medium text-success">{t("contacts.fields.isSyed")}</span>
              </div>
            )}
            {preferredLanguage && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                <span className="truncate">{t("contacts.form.preferredLanguage")}: <strong className="text-foreground">{preferredLanguage.toUpperCase()}</strong></span>
              </div>
            )}
            {preferredContactMethod && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                <span className="truncate">{t("contacts.form.preferredContactMethod")}: <strong className="text-foreground">{preferredContactMethod}</strong></span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground col-span-full flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                {tags.map((tag) => (
                  <span key={tag} className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
