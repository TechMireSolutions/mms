import {
  Calendar, User, MessageCircle, MessageSquare, Phone,
  LucideIcon, LayoutDashboard, History, Users as UsersIcon, FileText, Zap,
} from "lucide-react";
import { DEFAULT_DETAIL_TABS } from "@mms/shared";

export const ICON_MAP: Record<string, LucideIcon> = {
  // tab keys
  overview: LayoutDashboard,
  timeline: History,
  network: UsersIcon,
  files: FileText,
  // field keys
  gender: User,
  dob: Calendar,
  // activity types
  note: FileText,
  stage_change: Zap,
  system: User,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  call: Phone,
};

export const DETAIL_SYSTEM_TAB_KEYS = new Set(DEFAULT_DETAIL_TABS.map((tab) => tab.key));
export const DEFAULT_DETAIL_TAB_BY_KEY = new Map(DEFAULT_DETAIL_TABS.map((tab) => [tab.key, tab]));

export const DETAIL_STYLES = {
  whatsappActive: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  smsAction: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
  callAction: "bg-info/10 text-info border border-info/20 hover:bg-info/20",
  emailAction: "bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20",
  emergencyBadge: "bg-destructive/10 text-destructive border-destructive/30",
  networkHeader: "bg-success/10 border-success/30",
  networkIcon: "bg-success/10 text-success",
  networkTitle: "text-success",
  networkSubtitle: "text-success/80",
  networkItemCard: "border-border hover:border-success/30 hover:bg-success/5",
  networkItemIcon: "bg-success/10 text-success border border-success/20",
  networkItemAction: "hover:bg-muted text-muted-foreground hover:text-foreground",
  networkRelType: "text-success",
  liveIntelIndicator: "bg-success",
  liveIntelText: "text-success",
} as const;

export const COLLECTION_CONTAINER_CLASS = "divide-y divide-border/50";

export function isEmptyValue(val: unknown): boolean {
  if (val === undefined || val === null || val === "" || val === false) return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}
