import { ReactNode, useState } from "react";
import { MemberHeader } from "@/components/MemberHeader";
import { MemberSidebar } from "@/components/member/MemberSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MemberLayoutProps {
  children: ReactNode;
}

export function MemberLayout({ children }: MemberLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <MemberHeader />
        
        <div className="flex flex-1 w-full pt-[64px]">
          {isMobile ? (
            <>
              {/* Mobile: Hamburger Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-[72px] left-4 z-50 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <MemberSidebar onNavigate={() => setMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
              
              {/* Mobile: Main Content */}
              <main className="flex-1 w-full overflow-auto">
                {children}
              </main>
            </>
          ) : (
            <>
              {/* Desktop: Sidebar */}
              <MemberSidebar />
              
              {/* Desktop: Main Content */}
              <main className="flex-1 overflow-auto">
                {children}
              </main>
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
