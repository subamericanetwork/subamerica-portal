import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Play, Sparkles, LogIn, ArrowRight, BookOpen, Radio, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import subamericaLogo from "@/assets/subamerica-logo-small.jpg";

export function AnonymousHeader() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={subamericaLogo} alt={t('appName')} className="h-10 w-10 rounded-full" />
          <span className="text-xl font-bold">{t('appName')}</span>
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
                  {t('nav.home')}
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
                  {t('nav.watchTV')}
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
                  {t('nav.live')}
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
                  {t('nav.blog')}
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
                  {t('nav.features')}
                </Button>
                <div className="mt-4 pt-4 border-t">
                  <LanguageSwitcher />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>{t('nav.home')}</Button>
            <Button variant="ghost" onClick={() => navigate("/watch")}>{t('nav.watchTV')}</Button>
            <Button variant="ghost" onClick={() => navigate("/live")}>{t('nav.live')}</Button>
            <Button variant="ghost" onClick={() => navigate("/blog")}>{t('nav.blog')}</Button>
            <Button variant="ghost" onClick={() => navigate("/features")}>{t('nav.features')}</Button>
            <LanguageSwitcher />
            <Button variant="ghost" onClick={() => navigate("/auth")}>{t('nav.login')}</Button>
            <Button onClick={() => navigate("/auth")}>{t('nav.getStarted')}</Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
