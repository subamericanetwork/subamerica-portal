import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) {
          console.log("Auth state changed:", event, session);
        }
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

      // Assign 'fan' role by default
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: data.user.id,
          role: 'fan',
        });

      if (roleError) {
        if (import.meta.env.DEV) console.error("Role assignment error:", roleError);
        return { error: roleError };
      }

      // User profile is auto-created by database trigger

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
    await supabase.auth.signOut();
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
