import React from "react";
import { type Contact } from "@mms/shared";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface ContactAvatarProps {
  contact: Contact;
  className?: string;
}

export default function ContactAvatar({
  contact,
  className = "w-8 h-8 rounded-full text-xs",
}: ContactAvatarProps): React.JSX.Element {
  return (
    <UserAvatar
      id={contact.id}
      name={contact.name || contact.firstName}
      avatar={contact.avatar}
      className={className}
    />
  );
}

