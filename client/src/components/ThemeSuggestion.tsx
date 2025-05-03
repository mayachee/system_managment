import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ThemeSuggestion() {
  const { 
    theme, 
    suggestedTheme, 
    suggestedThemeReason, 
    applyTimeSuggestion, 
    hasSuggestion 
  } = useTheme();
  
  const [open, setOpen] = useState(false);
  
  // Show the suggestion toast after a short delay
  useEffect(() => {
    if (hasSuggestion) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000); // Show after 2 seconds to give user time to settle
      
      return () => clearTimeout(timer);
    }
  }, [hasSuggestion]);
  
  // No suggestion? Don't render anything
  if (!hasSuggestion) {
    return null;
  }
  
  const handleAccept = () => {
    applyTimeSuggestion();
    setOpen(false);
  };
  
  const handleDecline = () => {
    setOpen(false);
  };
  
  const isDark = suggestedTheme === "dark";
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-amber-100'}`}>
          {isDark ? (
            <Moon className="h-8 w-8 text-slate-200" />
          ) : (
            <Sun className="h-8 w-8 text-amber-600" />
          )}
        </div>
      
        <AlertDialogHeader className="pt-4">
          <AlertDialogTitle className="text-center text-xl">
            Time-Based Theme Suggestion
          </AlertDialogTitle>
          
          <div className={`my-2 p-3 rounded-lg ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-amber-50 text-amber-800'}`}>
            <p className="text-center font-medium">
              {suggestedThemeReason}
            </p>
          </div>
          
          <AlertDialogDescription className="text-center">
            Would you like to switch to{" "}
            <span className="font-semibold">
              {isDark ? "dark" : "light"}
            </span>{" "}
            mode now?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
          <AlertDialogCancel 
            onClick={handleDecline} 
            className="mt-0 w-full sm:w-auto"
          >
            Not now
          </AlertDialogCancel>
          
          <AlertDialogAction 
            onClick={handleAccept}
            className={`w-full sm:w-auto ${isDark ? 'bg-slate-800 hover:bg-slate-700' : ''}`}
          >
            Switch to {isDark ? "dark" : "light"} mode
          </AlertDialogAction>
          
          <div className="mt-2 text-xs text-center text-muted-foreground w-full">
            <p>You can enable automatic theme switching in Settings</p>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}