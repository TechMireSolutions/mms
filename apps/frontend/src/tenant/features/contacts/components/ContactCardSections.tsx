import type { JSX } from "react";
import { DirectoryCardInfoPills } from "@/components/ui/DirectoryCardInfoPills";

export {
  ContactCardMetadataGrid,
  ContactCardDeletedBanner,
} from "@/tenant/features/contacts/components/ContactCardMetadataGrid";

/** Contacts face phone/email pills — shared DirectoryCardInfoPills chrome. */
export function ContactCardInfoPills({
  phone,
  countryCode,
  phoneDisplay,
  email,
  isColumnVisible,
}: {
  phone: string | null;
  countryCode: string;
  phoneDisplay: string;
  email: string | null;
  isColumnVisible: (key: string) => boolean;
}): JSX.Element | null {
  return (
    <DirectoryCardInfoPills
      phone={phone}
      phoneDisplay={phoneDisplay}
      countryCode={countryCode}
      email={email}
      showPhone={isColumnVisible("phone")}
      showEmail={isColumnVisible("email")}
    />
  );
}
