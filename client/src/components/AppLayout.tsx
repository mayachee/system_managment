import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, Search, Menu, X, Bell, HelpCircle, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
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
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: <Icons.dashboard className="mr-3 text-lg" /> },
    { href: "/rentals", label: "Rentals", icon: <Icons.calendar className="mr-3 text-lg" /> },
    { href: "/cars", label: "Cars", icon: <Icons.car className="mr-3 text-lg" /> },
  ];

  const adminNavItems = [
    { href: "/locations", label: "Locations", icon: <Icons.location className="mr-3 text-lg" /> },
    { href: "/users", label: "Users", icon: <Icons.userSettings className="mr-3 text-lg" /> },
  ];

  const accountNavItems = [
    { href: "/profile", label: "Profile", icon: <Icons.user className="mr-3 text-lg" /> },
    { href: "#settings", label: "Settings", icon: <Icons.settings className="mr-3 text-lg" /> },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
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
              <p className="font-medium">{user?.username || "User"}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {user?.role === "admin" ? "Administrator" : "User"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Main
          </div>
          
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 font-medium",
                  isActive(item.href)
                    ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
          
          {/* Admin only links */}
          {user?.role === "admin" && (
            <>
              <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Admin
              </div>
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 font-medium",
                      isActive(item.href)
                        ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </>
          )}
          
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Account
          </div>
          
          {accountNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 font-medium",
                  isActive(item.href)
                    ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-300 border-l-4 border-primary-500"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium"
          >
            <Icons.logout className="mr-3 text-lg" />
            <span>Logout</span>
          </button>
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
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 w-full rounded-md"
                />
              </div>
            </div>
            
            {/* Right side nav items */}
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
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
                  <p>Notifications</p>
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
                  <p>Help</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 focus:outline-none p-1">
                    <Avatar className="w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                      <AvatarFallback>{user?.username ? getInitials(user.username) : "U"}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:block text-sm font-medium">{user?.username || "User"}</span>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Icon set
export const AppIcons = {
  dashboard: <Icons.dashboard />,
  car: <Icons.car />,
  calendar: <Icons.calendar />,
  location: <Icons.location />,
  user: <Icons.user />,
  userSettings: <Icons.userSettings />,
  settings: <Icons.settings />,
  logout: <Icons.logout />,
  time: <Icons.time />,
};
