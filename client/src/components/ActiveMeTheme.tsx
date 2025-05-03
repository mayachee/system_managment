import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell } from "lucide-react";

// Function to safely get items from localStorage (handles cases where localStorage is unavailable)
const getLocalStorageItem = (key: string, defaultValue: string): string => {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : defaultValue;
  } catch (error) {
    console.warn("Error accessing localStorage:", error);
    return defaultValue;
  }
};

// Function to safely set items in localStorage
const setLocalStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Error writing to localStorage:", error);
  }
};

export function ActiveMeTheme() {
  const { setTheme } = useTheme();
  const [isActive, setIsActive] = useState<boolean>(() => {
    const savedValue = getLocalStorageItem("active-me-theme", "false");
    return savedValue === "true";
  });
  const [activityCount, setActivityCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Toggle Active Me mode
  const toggleActiveMe = (checked: boolean) => {
    setIsActive(checked);
    setLocalStorageItem("active-me-theme", checked.toString());
    
    // Reset activity counter when enabling
    if (checked) {
      setActivityCount(0);
      setLastActivity(Date.now());
    }
  };

  // Track user activity (mouse movements, clicks, key presses)
  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => {
      setActivityCount(prev => prev + 1);
      setLastActivity(Date.now());
    };

    // Add event listeners for various user activities
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, [isActive]);

  // Process activity data and adjust theme
  useEffect(() => {
    if (!isActive) return;
    
    const activityInterval = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      
      // If no activity for 5 minutes, switch to dark mode
      if (timeSinceLastActivity > 5 * 60 * 1000) {
        console.log("Low activity detected, switching to dark mode for eye comfort");
        setTheme("dark");
      } 
      // If high activity in last minute (more than 50 interactions), use light mode for better visibility
      else if (activityCount > 50 && timeSinceLastActivity < 60 * 1000) {
        console.log("High activity detected, switching to light mode for better visibility");
        setTheme("light");
      }
      
      // Reset activity counter every 2 minutes
      if (timeSinceLastActivity > 2 * 60 * 1000) {
        setActivityCount(0);
      }
    }, 30 * 1000); // Check every 30 seconds
    
    return () => clearInterval(activityInterval);
  }, [isActive, activityCount, lastActivity, setTheme]);

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Active Me Theme
        </Label>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Automatically adjust theme based on your activity level
        </p>
      </div>
      <Switch 
        checked={isActive} 
        onCheckedChange={toggleActiveMe} 
      />
    </div>
  );
}