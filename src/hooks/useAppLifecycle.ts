import { useEffect, useRef } from "react";

interface AppLifecycleCallbacks {
  onAppActive?: () => void | Promise<void>;
  onAppBackground?: () => void | Promise<void>;
}

export const useAppLifecycle = ({ onAppActive, onAppBackground }: AppLifecycleCallbacks) => {
  const isActiveRef = useRef(true);
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isVisible = document.visibilityState === "visible";

      if (isVisible && !isActiveRef.current) {
        // App became active
        const inactiveTime = Date.now() - lastActiveRef.current;
        console.log(`[AppLifecycle] App became active after ${Math.round(inactiveTime / 1000)}s`);
        
        isActiveRef.current = true;
        
        if (onAppActive) {
          try {
            await onAppActive();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppActive callback", error);
          }
        }
      } else if (!isVisible && isActiveRef.current) {
        // App went to background
        console.log("[AppLifecycle] App going to background");
        
        isActiveRef.current = false;
        lastActiveRef.current = Date.now();
        
        if (onAppBackground) {
          try {
            await onAppBackground();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppBackground callback", error);
          }
        }
      }
    };

    const handleFocus = async () => {
      if (!isActiveRef.current) {
        console.log("[AppLifecycle] Window focused");
        isActiveRef.current = true;
        if (onAppActive) {
          try {
            await onAppActive();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppActive callback", error);
          }
        }
      }
    };

    const handleBlur = async () => {
      if (isActiveRef.current) {
        console.log("[AppLifecycle] Window blurred");
        isActiveRef.current = false;
        lastActiveRef.current = Date.now();
        if (onAppBackground) {
          try {
            await onAppBackground();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppBackground callback", error);
          }
        }
      }
    };

    // iOS Safari specific events
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted && !isActiveRef.current) {
        console.log("[AppLifecycle] Page restored from cache (iOS Safari)");
        isActiveRef.current = true;
        if (onAppActive) {
          try {
            await onAppActive();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppActive callback", error);
          }
        }
      }
    };

    const handlePageHide = async () => {
      if (isActiveRef.current) {
        console.log("[AppLifecycle] Page hidden (iOS Safari)");
        isActiveRef.current = false;
        lastActiveRef.current = Date.now();
        if (onAppBackground) {
          try {
            await onAppBackground();
          } catch (error) {
            console.error("[AppLifecycle] Error in onAppBackground callback", error);
          }
        }
      }
    };

    // Listen to multiple events for better coverage across browsers
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);

    console.log("[AppLifecycle] Lifecycle listeners registered");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      console.log("[AppLifecycle] Lifecycle listeners removed");
    };
  }, [onAppActive, onAppBackground]);
};
