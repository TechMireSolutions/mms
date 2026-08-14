import React, { createContext, useContext, useState } from 'react';

interface PlatformSidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const PlatformSidebarContext = createContext<PlatformSidebarContextValue | null>(null);

export function PlatformSidebarProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PlatformSidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        openMobileSidebar: () => setMobileOpen(true),
        closeMobileSidebar: () => setMobileOpen(false),
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
    };
  }
  return context;
}
