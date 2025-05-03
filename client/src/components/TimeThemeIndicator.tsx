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
  const { getTimeBasedTheme, theme, autoThemeSwitching } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeBasedSuggestion, setTimeBasedSuggestion] = useState<{theme: string, reason: string}>(getTimeBasedTheme());
  
  // Update time and suggested theme every minute
  useEffect(() => {
    // Update immediately on first render
    const now = new Date();
    setCurrentTime(now);
    setTimeBasedSuggestion(getTimeBasedTheme());
    
    // Then set up the interval
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setTimeBasedSuggestion(getTimeBasedTheme());
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
  const suggestedTheme = timeBasedSuggestion.theme;
  const matchesTimeTheme = currentEffectiveTheme === suggestedTheme;
  
  const autoModeEnabled = autoThemeSwitching && matchesTimeTheme;
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={`flex items-center gap-1.5 text-xs px-2 h-8 
              ${!matchesTimeTheme ? 'bg-amber-100/30 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : ''} 
              ${autoModeEnabled ? 'bg-green-100/30 dark:bg-green-900/30 text-green-600 dark:text-green-400' : ''}
            `}
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
            {autoThemeSwitching && (
              <span className="ml-1 bg-green-500/20 dark:bg-green-300/20 text-green-600 dark:text-green-300 text-[10px] px-1 py-0.5 rounded">
                AUTO
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p>
              <span className="font-medium">Current time: </span> 
              {formattedTime} 
              <span className="ml-1 text-muted-foreground">suggests {suggestedTheme} mode</span>
            </p>
            
            {!matchesTimeTheme && !autoThemeSwitching && (
              <p className="text-amber-600 dark:text-amber-400 font-medium text-sm">
                Your theme doesn't match the time suggestion.
                <br />
                <span className="text-xs">Enable auto switching in Settings</span>
              </p>
            )}
            
            {autoThemeSwitching && (
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                Auto switching is enabled. Theme will adjust automatically.
              </p>
            )}
            
            <div className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
              <p className="font-medium mb-1">Time-based theme schedule:</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <span>5AM-8AM:</span><span>Light (wake up)</span>
                <span>8AM-5PM:</span><span>Light (productivity)</span>
                <span>5PM-7PM:</span><span>Light (transition)</span>
                <span>7PM-10PM:</span><span>Dark (wind down)</span>
                <span>10PM-5AM:</span><span>Dark (sleep quality)</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}