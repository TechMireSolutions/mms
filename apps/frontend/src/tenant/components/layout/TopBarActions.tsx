import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  User,
  Settings,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROUTES } from "@/lib/config/routes";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import SyncStatusBadge from "@/tenant/components/layout/SyncStatusBadge";
import { BackgroundJobsTray } from "@/components/ui/BackgroundJobsTray";
import { TenantNotificationsPopover } from "@/tenant/components/layout/TenantNotificationsPopover";

export interface TopBarActionsProps {
  /** Tighter spacing for mobile header. */
  compact?: boolean;
  onOpenCommandPalette?: () => void;
  className?: string;
}

/**
 * Notifications, sync status, and user session menu — shared across desktop and mobile headers.
 */
export default function TopBarActions({ compact = false, onOpenCommandPalette, className }: TopBarActionsProps): React.JSX.Element {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className={cn("flex shrink-0 items-center gap-1 sm:gap-2", className)}>
      {compact && onOpenCommandPalette && (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenCommandPalette}
          aria-label={t("nav.globalSearchPlaceholder")}
          className="relative flex items-center justify-center rounded-lg text-xs text-muted-foreground border-border/80 hover:bg-muted/80 transition-colors cursor-pointer min-h-11 min-w-11 h-11 w-11 p-0"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      )}
      <SyncStatusBadge />
      <BackgroundJobsTray compact={compact} />
      <TenantNotificationsPopover />

      {!compact ? <div className="mx-1 hidden h-6 w-px bg-border sm:block" /> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label={t("account.title")}
            className={cn(
              "flex items-center rounded-lg transition-colors hover:bg-muted justify-start font-normal h-auto cursor-pointer",
              compact ? "min-h-11 min-w-11 gap-1 p-2" : "min-h-11 gap-2.5 py-2 ps-2 pe-3",
            )}
          >
            <UserAvatar
              name={user?.name ?? "User"}
              size={compact ? "sm" : "md"}
              className={compact ? "h-7 w-7" : "h-8 w-8"}
            />
            {!compact ? (
              <>
                <div className="hidden text-start sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" aria-hidden />
              </>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div>
              <p className="text-sm font-medium">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={ROUTES.profile}>
              <User className="me-2 h-4 w-4" />
              {t("account.title")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={ROUTES.settings}>
              <Settings className="me-2 h-4 w-4" />
              {t("nav.settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer"
            onClick={() => logout(true)}
          >
            <LogOut className="me-2 h-4 w-4" />
            {t("auth.signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
