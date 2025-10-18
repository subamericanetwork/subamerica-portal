import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Video, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Eye,
  User,
  Settings,
  LogOut,
  Menu,
  Shield,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/subamerica-logo-small.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      setIsAdmin(data || false);
    };
    
    checkAdmin();
  }, [user]);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Videos", href: "/videos", icon: Video },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Merch", href: "/merch", icon: ShoppingBag },
    { name: "Payments", href: "/payments", icon: DollarSign },
    { name: "Monetization", href: "/monetization", icon: QrCode },
    { name: "Preview Port", href: "/preview", icon: Eye },
  ];

  const adminNavigation = [
    { name: "Admin: Videos", href: "/admin/videos", icon: Shield },
    { name: "Admin: Payments", href: "/admin/payments", icon: DollarSign },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavigationContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <div className="p-6 border-b border-border">
        <img 
          src={logo} 
          alt="Subamerica" 
          className="h-12 w-auto"
        />
        <p className="text-xs text-muted-foreground mt-1">Artist Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => mobile && setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
        
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
            </div>
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => mobile && setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          size="sm"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile Header with Hamburger */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center px-4 z-40">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <NavigationContent mobile />
            </div>
          </SheetContent>
        </Sheet>
        <img src={logo} alt="Subamerica" className="h-8 w-auto ml-4" />
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
        <NavigationContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
