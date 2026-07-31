import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  disableBrowserScrollRestoration,
  scrollDocumentToTop,
} from "@/lib/routing/scrollDocumentToTop";

/** Keep newly opened routes at the top — single route-scroll policy for the SPA. */
export function useScrollToTopOnNavigate(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    disableBrowserScrollRestoration();
  }, []);

  useEffect(() => {
    scrollDocumentToTop();
  }, [pathname]);
}
