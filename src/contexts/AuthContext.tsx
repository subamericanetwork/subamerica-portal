import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { authStorage } from "@/lib/authStorage";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // Session restoration function
  const restoreSession = async () => {
    if (isRestoringRef.current) return;
    
    isRestoringRef.current = true;
    console.log("[Auth] Attempting to restore session...");

    try {
      // Try to get session from Supabase
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[Auth] Error getting session from Supabase:", error);
        
        // Try to recover from IndexedDB/localStorage
        const storedSession = await authStorage.getSession();
        if (storedSession) {
          console.log("[Auth] Recovered session from storage");
          setSession(storedSession);
          setUser(storedSession.user);
          // Try to refresh this session with Supabase
          await supabase.auth.setSession(storedSession);
        } else {
          console.log("[Auth] No stored session found");
          setSession(null);
          setUser(null);
        }
      } else if (supabaseSession) {
        console.log("[Auth] Session restored from Supabase");
        setSession(supabaseSession);
        setUser(supabaseSession.user);
        await authStorage.setSession(supabaseSession);
      } else {
        console.log("[Auth] No active session");
        setSession(null);
        setUser(null);
        await authStorage.clearSession();
      }
    } catch (error) {
      console.error("[Auth] Session restoration failed:", error);
      setSession(null);
      setUser(null);
    } finally {
      isRestoringRef.current = false;
    }
  };

  // Session health check and token refresh
  const verifyAndRefreshSession = async () => {
    if (!session) return;

    try {
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);

      // Refresh if token expires in next 5 minutes (300 seconds)
      if (expiresAt && expiresAt - now < 300) {
        console.log("[Auth] Token expiring soon, refreshing...");
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error("[Auth] Token refresh failed:", error);
          // Try to restore session
          await restoreSession();
        } else if (refreshedSession) {
          console.log("[Auth] Token refreshed successfully");
          setSession(refreshedSession);
          setUser(refreshedSession.user);
          await authStorage.setSession(refreshedSession);
        }
      }
    } catch (error) {
      console.error("[Auth] Health check failed:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          console.log("[Auth] State changed:", event);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Store session in persistent storage
        if (session) {
          await authStorage.setSession(session);
        } else {
          await authStorage.clearSession();
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      await restoreSession();
      setLoading(false);
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Periodic session health check (every 60 seconds)
  useEffect(() => {
    if (session) {
      console.log("[Auth] Starting health check interval");
      healthCheckIntervalRef.current = setInterval(verifyAndRefreshSession, 60000);
    } else {
      if (healthCheckIntervalRef.current) {
        console.log("[Auth] Stopping health check interval");
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    }

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [session]);

  // Listen to visibility changes for session restoration
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        console.log("[Auth] App became visible, checking session...");
        await restoreSession();
        await verifyAndRefreshSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName,
          }
        }
      });

      if (error) return { error };
      if (!data.user) return { error: { message: "Signup failed" } };

      // User profile and member role are auto-created by database triggers

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Check for active lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitTime = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return { error: { message: `Too many login attempts. Please try again in ${waitTime} seconds.` } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle failed login attempts with exponential backoff
    if (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      // Apply lockout after 5 failed attempts with exponential backoff
      if (newAttempts >= 5) {
        const lockoutDuration = Math.pow(2, newAttempts - 4) * 1000; // 2s, 4s, 8s, 16s, etc.
        setLockoutUntil(Date.now() + lockoutDuration);
      }
    } else {
      // Reset on successful login
      setFailedAttempts(0);
      setLockoutUntil(null);
    }

    return { error };
  };

  const signOut = async () => {
    console.log("[Auth] Signing out...");
    await supabase.auth.signOut();
    await authStorage.clearSession();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
