import { ReactNode } from "react";
import { MemberHeader } from "@/components/MemberHeader";
import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import { cn } from "@/lib/utils";

interface MemberLayoutProps {
  children: ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  const { currentTrack } = usePlayer();
  const hasMiniPlayer = !!currentTrack;

  return (
    <div className="min-h-screen">
      <MemberHeader />
      {hasMiniPlayer && <MiniPlayer />}
      <main className={cn(
        hasMiniPlayer ? "pt-[124px]" : "pt-[64px]"
      )}>
        {children}
      </main>
    </div>
  );
}
