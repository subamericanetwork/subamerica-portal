import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UniversalSidebar } from "./UniversalSidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface UniversalLayoutProps {
  children: ReactNode;
}

export function UniversalLayout({ children }: UniversalLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Simplified Header - Just logo and user controls */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="h-full flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              {!isMobile && <SidebarTrigger />}
              <button onClick={() => navigate("/")} className="flex items-center gap-2">
                <img src="/subamerica-logo-small.jpg" alt="Subamerica" className="w-8 h-8 rounded" />
                <span className="font-bold text-lg">Subamerica</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!user && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                    Login
                  </Button>
                  <Button size="sm" onClick={() => navigate("/auth?tab=signup")}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex flex-1 w-full pt-16">
          {isMobile ? (
            <>
              {/* Mobile: Hamburger Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="fixed top-20 left-4 z-50 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <UniversalSidebar onNavigate={() => setMobileMenuOpen(false)} />
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
              <UniversalSidebar />

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
