import { Eye, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/useTranslation";
import type { Distribution } from "@/lib/data/hasanatData";

type DistributionStatus = Distribution["status"];

interface DistributionRowActionsProps {
  distribution: Distribution;
  statuses: DistributionStatus[];
  statusLabels: Record<DistributionStatus, string>;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  canRestoreRows: boolean;
  canDeleteRows: boolean;
  onMessage?: (channel: "sms" | "whatsapp" | "email", distributions: Distribution[]) => void;
  onChangeStatus: (id: string, status: DistributionStatus) => void;
  onRowTrashAction: (id: string) => void;
}

export function DistributionRowActions({
  distribution,
  statuses,
  statusLabels,
  canWrite,
  canDelete,
  showDeleted,
  canRestoreRows,
  canDeleteRows,
  onMessage,
  onChangeStatus,
  onRowTrashAction,
}: DistributionRowActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      {(canWrite || onMessage) && !showDeleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" type="button" size="icon" aria-label={t("hasanat.changeStatus")} className="rounded-lg hover:bg-muted text-muted-foreground">
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {canWrite && (
              <>
                <DropdownMenuLabel className="text-xs">{t("hasanat.changeStatus")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={distribution.status} onValueChange={(status) => onChangeStatus(distribution.id, status as DistributionStatus)}>
                  {statuses.map((status) => (
                    <DropdownMenuRadioItem key={status} value={status}>
                      {statusLabels[status]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </>
            )}
            {onMessage && (
              <>
                {canWrite && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs">{t("messaging.channel")}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onMessage("whatsapp", [distribution])}>
                  {t("messaging.channel.whatsapp")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMessage("sms", [distribution])}>
                  {t("messaging.channel.sms")}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canDelete && (showDeleted ? canRestoreRows : canDeleteRows) && (
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="rounded-lg hover:bg-muted text-muted-foreground"
          onClick={() => onRowTrashAction(distribution.id)}
          aria-label={showDeleted ? t("hasanat.trash.restore") : t("common.delete")}
        >
          {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
        </Button>
      )}
    </>
  );
}
