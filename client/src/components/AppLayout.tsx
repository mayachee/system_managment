import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, Search, Menu, X, Bell, HelpCircle, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useLocalization } from "@/hooks/use-localization";
import { TimeThemeIndicator } from "@/components/TimeThemeIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AIAssistant } from "@/components/Dashboard/AIAssistant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", label: t("nav.dashboard"), icon: <Icons.dashboard className="mr-3 text-lg" /> },
    { href: "/rentals", label: t("nav.rentals"), icon: <Icons.calendar className="mr-3 text-lg" /> },
    { href: "/cars", label: t("nav.cars"), icon: <Icons.car className="mr-3 text-lg" /> },
    { href: "/maintenance", label: t("nav.maintenance"), icon: <Icons.tool className="mr-3 text-lg" /> },
    { href: "/insurance", label: t("nav.insurance"), icon: <Icons.insurance className="mr-3 text-lg" /> },
    { href: "/loyalty", label: t("nav.loyaltyProgram"), icon: <Icons.award className="mr-3 text-lg" /> },
  ];

  const adminNavItems = [
    { href: "/locations", label: t("nav.locations"), icon: <Icons.location className="mr-3 text-lg" /> },
    { href: "/users", label: t("nav.users"), icon: <Icons.userSettings className="mr-3 text-lg" /> },
  ];

  const accountNavItems = [
    { href: "/profile", label: t("nav.profile"), icon: <Icons.user className="mr-3 text-lg" /> },
    { href: "/settings", label: t("nav.settings"), icon: <Icons.settings className="mr-3 text-lg" /> },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    // Always set theme to light regardless of current state
    setTheme("light");
    console.log("Setting theme to light");
    
    // Force light mode
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.dataset.theme = "light";
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar (desktop) */}
      <aside 
        className={cn(
          "fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 shadow-sm transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icons.car className="text-2xl text-primary" />
            <span className="font-bold text-lg">CarRental</span>
          </div>
          <button 
            className="md:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
              <AvatarFallback>{user?.username ? getInitials(user.username) : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.username || t('app.user')}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {user?.role === "admin" ? t('app.administrator') : t('app.user')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('nav.mainSection')}
          </div>
          
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} 
              className={cn(
                "flex items-center px-4 py-3 font-medium",
                isActive(item.href)
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          {/* Admin only links */}
          {user?.role === "admin" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('nav.adminSection')}
              </div>
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 font-medium",
                    isActive(item.href)
                      ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
          
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('nav.accountSection')}
          </div>
          
          {accountNavItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center px-4 py-3 font-medium",
                isActive(item.href)
                  ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium"
          >
            <Icons.logout className="mr-3 text-lg" />
            <span>{t('nav.logout')}</span>
          </button>
          
          {/* AI Assistant Button - With special styling */}
          <div className="px-4 mt-6 mb-2 flex items-center">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
            <span className="mx-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('nav.aiAssistant') || "AI Assistant"}
            </span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
          </div>
          <div className="px-4 py-3">
            <button
              onClick={() => document.getElementById('ai-assistant-trigger')?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-primary to-primary/90 text-white px-4 py-2.5 font-medium hover:shadow-md transition-all animate-pulse hover:animate-none"
            >
              <Icons.bot className="h-5 w-5" />
              <span>{t('nav.openAIAssistant') || "Open Assistant"}</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation bar */}
        <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Mobile menu button and search */}
            <div className="flex items-center space-x-4">
              <button 
                className="md:hidden text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200" 
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <Input 
                  placeholder={`${t('app.search')}...`}
                  className="pl-10 pr-4 py-2 w-full rounded-md"
                />
              </div>
            </div>
            
            {/* Right side nav items */}
            <div className="flex items-center space-x-4">
              <TimeThemeIndicator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    {/* Always show moon icon since we're in light mode */}
                    <MoonIcon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('app.toggleTheme')}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 relative"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('app.notifications')}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('app.help')}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none p-1">
                    <Avatar className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      <AvatarFallback>{user?.username ? getInitials(user.username) : "U"}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium">{user?.username || t('app.user')}</span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">{t('nav.profile')}</DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">{t('nav.settings')}</DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6 relative">
          {children}
          
          {/* AI Assistant */}
          <AIAssistant />
        </main>
      </div>
    </div>
  );
}

// Icon set is now part of the Icons component in ui/icons.tsx
