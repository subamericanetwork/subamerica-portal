import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Play, Sparkles, LogIn, ArrowRight, BookOpen, Radio, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

export function AnonymousHeader() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="fixed top-0 z-40 w-full border-b border-border bg-background/20 backdrop-blur-md supports-[backdrop-filter]:bg-background/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Left: Logo + "Subamerica" */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <img src={subamericaLogo} alt="Subamerica" className="h-8" />
          <span className="text-lg font-semibold">Subamerica</span>
        </div>
        
        {/* Right: Navigation Links */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-4 mt-8">
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/watch");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch TV
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/live");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Radio className="h-4 w-4 mr-2" />
                  Live
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/blog");
                    setMobileMenuOpen(false);
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Blog
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate("/features");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Features
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/watch")}>
            <Play className="h-4 w-4" />
            Watch TV
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/live")}>
            <Radio className="h-4 w-4" />
            Live
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/blog")}>
            <BookOpen className="h-4 w-4" />
            Blog
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/features")}>
            <Sparkles className="h-4 w-4" />
            Features
          </Button>
          
          {/* Mobile + Desktop */}
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            <LogIn className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Login</span>
          </Button>
          <Button size="sm" className="glow-primary" onClick={() => navigate("/auth?tab=signup")}>
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
