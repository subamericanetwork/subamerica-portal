import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Send pageview to GA when route changes
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-2TWBE13CP7', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};
