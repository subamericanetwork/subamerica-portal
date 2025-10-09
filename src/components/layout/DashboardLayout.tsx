import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Video, 
  Calendar, 
  ShoppingBag, 
  DollarSign, 
  Eye,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/subamerica-logo-small.jpg";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Videos", href: "/videos", icon: Video },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Merch", href: "/merch", icon: ShoppingBag },
    { name: "Monetization", href: "/monetization", icon: DollarSign },
    { name: "Preview Port", href: "/preview", icon: Eye },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <img 
            src={logo} 
            alt="Subamerica" 
            className="h-12 w-auto"
          />
          <p className="text-xs text-muted-foreground mt-1">Creator Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
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
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
