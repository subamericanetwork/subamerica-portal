import { ReactNode } from "react";
import { MemberHeader } from "@/components/MemberHeader";

interface MemberLayoutProps {
  children: ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  return (
    <div className="min-h-screen">
      <MemberHeader />
      <main className="pt-[64px]">
        {children}
      </main>
    </div>
  );
}
