import { Send } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_TEXT } from "@/lib/semanticTone";
import { MESSAGING_CHANNEL_CONFIG } from "../config";

interface MessagingPageHeaderActionsProps {
  canWrite: boolean;
  startingCampaign: boolean;
  onStartCampaign: (channel: "whatsapp" | "sms" | "email") => void;
}

export function MessagingPageHeaderActions({
  canWrite,
  startingCampaign,
  onStartCampaign,
}: MessagingPageHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!canWrite) return null;

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ActionButton
            variant="primary"
            icon={Send}
            disabled={startingCampaign}
            loading={startingCampaign}
          >
            {t("messaging.newCampaign")}
          </ActionButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {Object.values(MESSAGING_CHANNEL_CONFIG).map((config) => (
            <DropdownMenuItem
              key={config.id}
              onClick={() => void onStartCampaign(config.id)}
              className="cursor-pointer gap-2 py-2"
            >
              <config.icon
                className={`h-4 w-4 ${
                  SEMANTIC_TEXT[config.themeAccent as keyof typeof SEMANTIC_TEXT]
                }`}
              />
              <span className="font-medium flex-1">
                {t(config.labelSendKey as any)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
