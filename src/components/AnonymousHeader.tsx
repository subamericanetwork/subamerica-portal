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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={subamericaLogo} alt="Subamerica" className="h-10 w-10 rounded-full" />
          <span className="text-xl font-bold">Subamerica</span>
        </div>
        
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
            <Button variant="ghost" onClick={() => navigate("/watch")}>Watch TV</Button>
            <Button variant="ghost" onClick={() => navigate("/live")}>Live</Button>
            <Button variant="ghost" onClick={() => navigate("/blog")}>Blog</Button>
            <Button variant="ghost" onClick={() => navigate("/features")}>Features</Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>Login</Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
