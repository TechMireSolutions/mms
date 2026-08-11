import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import {
  isRbacModuleEnabled,
  rbacModuleLabel,
  workspaceRoleDescription,
  workspaceRoleLabel,
  type WorkspaceRole,
} from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";

interface RoleCardProps {
  role: WorkspaceRole;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function RoleCard({ role, selected, onSelect }: RoleCardProps): JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const [showPerms, setShowPerms] = useState(false);

  return (
    <div className={`rounded-xl border-2 transition-all cursor-pointer ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
    }`}>
      <div className="p-3 flex items-start gap-3" onClick={() => onSelect(role.id)}>
        <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? "bg-primary border-primary" : "border-border"
        }`}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Badge pill tone="primary" className="px-2 font-bold bg-primary/15 border-primary/30">
              {workspaceRoleLabel(role, t)}
            </Badge>
            <Button
              type="button"
              variant="link"
              onClick={(event) => { event.stopPropagation(); setShowPerms((visible) => !visible); }}
              className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline min-h-11 px-2 shadow-none"
            >
              <Info className="w-3 h-3" /> {showPerms ? t("users.addHidePermissions") : t("users.addShowPermissions")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{workspaceRoleDescription(role, t)}</p>
        </div>
      </div>

      <AnimatePresence>
        {showPerms && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {Object.entries(role.permissions || {})
                .filter(([moduleId]) => isRbacModuleEnabled(moduleId, globalSettings.enabledModules))
                .map(([moduleId, permissions]) => (
                  <div key={moduleId} className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{rbacModuleLabel(moduleId, t)}:</span>{" "}
                    {permissions.map((permissionAction) => t(`users.permission.${permissionAction}`)).join(", ")}
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
