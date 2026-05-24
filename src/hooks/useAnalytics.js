import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../lib/analytics";

export default function useAnalytics() {
  const location = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    const currentPath = location.pathname + location.search;

    if (prevPath.current === currentPath) return;
    prevPath.current = currentPath;

    const title =
      document.title || location.pathname || "Extrovertidos";

    trackPageView(currentPath, title);
  }, [location]);
}
