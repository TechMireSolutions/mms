import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mms_platform_sidebar_collapsed';

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface PlatformSidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleCollapsed: () => void;
  /** Opens the platform command palette from any sidebar button. */
  openCommandPalette: () => void;
  /** Internal setter — injected by PlatformSidebarProvider to own command palette open state. */
  setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Read by PlatformPageShell to sync its local searchOpen state with context. */
  commandPaletteOpen: boolean;
}

const PlatformSidebarContext = createContext<PlatformSidebarContextValue | null>(null);

export function PlatformSidebarProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore quota/private mode restrictions
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const openCommandPalette = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  return (
    <PlatformSidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        openMobileSidebar: () => setMobileOpen(true),
        closeMobileSidebar: () => setMobileOpen(false),
        collapsed,
        setCollapsed,
        toggleCollapsed,
        openCommandPalette,
        setCommandPaletteOpen,
        commandPaletteOpen,
      }}
    >
      {children}
    </PlatformSidebarContext.Provider>
  );
}

export function usePlatformSidebar(): PlatformSidebarContextValue {
  const context = useContext(PlatformSidebarContext);
  if (!context) {
    // Graceful fallback for non-provider renders in unit tests
    return {
      mobileOpen: false,
      setMobileOpen: () => {},
      openMobileSidebar: () => {},
      closeMobileSidebar: () => {},
      collapsed: false,
      setCollapsed: () => {},
      toggleCollapsed: () => {},
      openCommandPalette: () => {},
      setCommandPaletteOpen: () => {},
      commandPaletteOpen: false,
    };
  }
  return context;
}
