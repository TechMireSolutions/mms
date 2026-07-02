import React from "react";
import { getInitials, getAvatarColor, Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

interface ContactAvatarProps {
  contact: Contact;
  className?: string;
}

export default function ContactAvatar({ contact, className = "w-8 h-8 rounded-full text-xs" }: ContactAvatarProps): React.JSX.Element {
  const { t } = useTranslation();
  const initials = getInitials(contact.name || contact.firstName, 2) || "?";
  const colorClass = getAvatarColor(contact.id);
  
  if (contact.avatar) {
    return (
      <img
        src={contact.avatar}
        alt={contact.name || contact.firstName || t("contacts.avatarAlt")}
        className={`${className} object-cover flex-shrink-0 border border-border`}
      />
    );
  }
  
  return (
    <div className={`${className} ${colorClass} flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}
