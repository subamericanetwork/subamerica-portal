import { useNavigate } from "react-router-dom";
import { Home, Play, Sparkles, LogIn, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

export function AnonymousHeader() {
  const navigate = useNavigate();
  
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
          {/* Desktop Navigation */}
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={() => navigate("/watch")}>
            <Play className="h-4 w-4" />
            Watch
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
