import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AnonymousHeader } from "@/components/AnonymousHeader";
import { MemberHeader } from "@/components/MemberHeader";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="h-[64px]" />
      ) : user ? (
        <MemberHeader />
      ) : (
        <AnonymousHeader />
      )}
      <main className="pt-[64px]">
        {children}
      </main>
    </div>
  );
}
