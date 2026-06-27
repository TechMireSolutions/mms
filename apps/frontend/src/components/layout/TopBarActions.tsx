import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ROUTES } from "@/lib/config/routes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import SyncStatusBadge from "./SyncStatusBadge";
import { BackgroundJobsTray } from "@/components/ui/BackgroundJobsTray";

import { useDashboardData } from "@/hooks/useDashboardData";
import { resolveDashboardRole } from "@/lib/dashboardRole";
import { usePermissions } from "@/hooks/usePermissions";
import { buildDashboardNotifications } from "@/lib/buildDashboardNotifications";

export interface TopBarActionsProps {
  /** Tighter spacing for mobile header. */
  compact?: boolean;
  className?: string;
}

/**
 * Notifications, sync status, and user session menu — shared across desktop and mobile headers.
 */
export default function TopBarActions({ compact = false, className }: TopBarActionsProps): React.JSX.Element {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const initials = user?.name
    ? user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()
    : "AK";

  const { can } = usePermissions();
  const dashboardRole = resolveDashboardRole(can);
  const { invoices, attendanceRecords, studentMetricsInactive } = useDashboardData([], dashboardRole);

  const notifications = React.useMemo(() => {
    return buildDashboardNotifications(
      dashboardRole,
      { invoices, attendanceRecords, inactiveStudents: studentMetricsInactive },
      t,
    );
  }, [dashboardRole, invoices, attendanceRecords, studentMetricsInactive, t]);

  const unreadCount = notifications.length;

  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  return (
    <div className={cn("flex shrink-0 items-center gap-1 sm:gap-2", className)}>
      <SyncStatusBadge />
      <BackgroundJobsTray compact={compact} />

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative rounded-lg p-2 hover:bg-muted transition-colors h-9 w-9"
          >
            <Bell className="h-[18px] w-[18px] text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                All caught up! No notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-border/50 px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors bg-primary/[0.02]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.desc}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border px-4 py-2.5">
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setPopoverOpen(false);
                navigate(ROUTES.home);
              }}
              className="text-xs font-medium text-primary hover:underline p-0 h-auto"
            >
              View all notifications
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {!compact ? <div className="mx-1 hidden h-6 w-px bg-border sm:block" /> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            aria-label="Account menu"
            className={cn(
              "flex items-center rounded-lg transition-colors hover:bg-muted justify-start font-normal h-auto",
              compact ? "gap-1 p-1.5" : "gap-2.5 py-1.5 pl-2 pr-3",
            )}
          >
            <Avatar className={compact ? "h-7 w-7" : "h-8 w-8"}>
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!compact ? (
              <>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
                </div>
                <ChevronDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
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
              <User className="mr-2 h-4 w-4" />
              {t("account.title")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={ROUTES.settings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => logout(true)}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
