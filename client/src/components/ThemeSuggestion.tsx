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
  const { theme, suggestedTheme, applyTimeSuggestion, hasSuggestion } = useTheme();
  const [open, setOpen] = useState(false);
  
  // Show the suggestion toast after a short delay
  useEffect(() => {
    if (hasSuggestion) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1000); // Show after 1 second
      
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
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            {suggestedTheme === "dark" ? (
              <Moon className="mr-2 h-5 w-5" />
            ) : (
              <Sun className="mr-2 h-5 w-5" />
            )}
            Theme Suggestion
          </AlertDialogTitle>
          <AlertDialogDescription>
            Based on the time of day, would you like to switch to{" "}
            <span className="font-medium">
              {suggestedTheme === "dark" ? "dark" : "light"}
            </span>{" "}
            mode for better visibility?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDecline}>No, thanks</AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept}>
            Yes, switch to {suggestedTheme === "dark" ? "dark" : "light"} mode
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}