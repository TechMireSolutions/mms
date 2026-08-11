import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export interface EntityMessagingDropdownItemsProps {
  showWhatsApp: boolean;
  showSms: boolean;
  showEmail: boolean;
  onWhatsAppClick: () => void;
  onSmsClick: () => void;
  onEmailClick: () => void;
  /** Localized channel labels (translated by the module). */
  labels: {
    whatsapp: string;
    sms: string;
    email: string;
  };
}

/**
 * WhatsApp / SMS / Email channel trio for Work row-action menus.
 *
 * Modules translate the labels and pass `show*` + click handlers; the icon
 * tones stay canonical (`text-success` WhatsApp, `text-info` SMS, `text-primary` Email).
 */
export function EntityMessagingDropdownItems({
  showWhatsApp,
  showSms,
  showEmail,
  onWhatsAppClick,
  onSmsClick,
  onEmailClick,
  labels,
}: EntityMessagingDropdownItemsProps): React.JSX.Element {
  return (
    <>
      {showWhatsApp ? (
        <DropdownMenuItem onClick={onWhatsAppClick}>
          <MessageCircle className="w-3.5 h-3.5 me-2 text-success" /> {labels.whatsapp}
        </DropdownMenuItem>
      ) : null}
      {showSms ? (
        <DropdownMenuItem onClick={onSmsClick}>
          <MessageSquare className="w-3.5 h-3.5 me-2 text-info" /> {labels.sms}
        </DropdownMenuItem>
      ) : null}
      {showEmail ? (
        <DropdownMenuItem onClick={onEmailClick}>
          <Mail className="w-3.5 h-3.5 me-2 text-primary" /> {labels.email}
        </DropdownMenuItem>
      ) : null}
    </>
  );
}
