import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TimeThemeIndicator() {
  const { getTimeBasedTheme, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [suggestedTheme, setSuggestedTheme] = useState(getTimeBasedTheme());
  
  // Update time and suggested theme every minute
  useEffect(() => {
    // Update immediately on first render
    const now = new Date();
    setCurrentTime(now);
    setSuggestedTheme(getTimeBasedTheme());
    
    // Then set up the interval
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setSuggestedTheme(getTimeBasedTheme());
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [getTimeBasedTheme]);
  
  // Format time as hours:minutes AM/PM
  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Get the current effective theme (accounting for system preference)
  const getEffectiveTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };
  
  // Check if current theme matches the time-based suggestion
  const currentEffectiveTheme = getEffectiveTheme();
  const matchesTimeTheme = currentEffectiveTheme === suggestedTheme;
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={`flex items-center gap-1.5 text-xs px-2 h-8 ${
              matchesTimeTheme ? '' : 'bg-amber-100/30 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="font-normal">
              {formattedTime}
            </span>
            {suggestedTheme === "dark" ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            Current time suggests {suggestedTheme} mode
            <br />
            {!matchesTimeTheme && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Your theme doesn't match the time suggestion
              </span>
            )}
            <span className="text-xs text-muted-foreground block mt-1">
              5AM-7PM: Light mode
              <br />
              7PM-5AM: Dark mode
            </span>
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}