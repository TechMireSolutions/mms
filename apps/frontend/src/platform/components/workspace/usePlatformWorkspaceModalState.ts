import { useState } from 'react';
import type { PlatformWorkspaceRow as PlatformWorkspaceRowData } from '@mms/shared';

export function usePlatformWorkspaceModalState() {
  const [modulesOpen, setModulesOpen] = useState(false);
  const [targetModulesWorkspace, setTargetModulesWorkspace] = useState<PlatformWorkspaceRowData | null>(null);

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [targetResetWorkspace, setTargetResetWorkspace] = useState<PlatformWorkspaceRowData | null>(null);

  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [targetCreateWorkspace, setTargetCreateWorkspace] = useState<PlatformWorkspaceRowData | null>(null);

  const handleOpenModules = (workspace: PlatformWorkspaceRowData): void => {
    setTargetModulesWorkspace(workspace);
    setModulesOpen(true);
  };

  const handleOpenResetPassword = (workspace: PlatformWorkspaceRowData): void => {
    setTargetResetWorkspace(workspace);
    setResetPasswordOpen(true);
  };

  const handleOpenCreateAdmin = (workspace: PlatformWorkspaceRowData): void => {
    setTargetCreateWorkspace(workspace);
    setCreateAdminOpen(true);
  };

  return {
    modulesOpen,
    setModulesOpen,
    targetModulesWorkspace,
    handleOpenModules,
    resetPasswordOpen,
    setResetPasswordOpen,
    targetResetWorkspace,
    handleOpenResetPassword,
    createAdminOpen,
    setCreateAdminOpen,
    targetCreateWorkspace,
    handleOpenCreateAdmin,
  };
}
