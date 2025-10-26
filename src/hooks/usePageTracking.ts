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
    // Function to send pageview to GA
    const sendPageView = () => {
      if (typeof window.gtag === 'function') {
        console.log('[GA] Tracking pageview:', location.pathname);
        window.gtag('config', 'G-2TWBE13CP7', {
          page_path: location.pathname + location.search,
          debug_mode: true
        });
        return true;
      }
      return false;
    };

    // Try to send immediately
    if (sendPageView()) {
      return;
    }

    // If GA not ready yet, wait for it with retry mechanism
    console.log('[GA] Waiting for gtag to load...');
    const checkInterval = setInterval(() => {
      if (sendPageView()) {
        console.log('[GA] gtag loaded successfully');
        clearInterval(checkInterval);
      }
    }, 100); // Check every 100ms

    // Cleanup: stop checking after 10 seconds or when component unmounts
    const timeout = setTimeout(() => {
      console.warn('[GA] gtag failed to load after 10 seconds');
      clearInterval(checkInterval);
    }, 10000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [location]);
};
