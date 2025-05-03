import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type TimeBasedThemeResult = {
  theme: Theme;
  reason: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  suggestedTheme: Theme | null;
  suggestedThemeReason: string;
  getTimeBasedTheme: () => TimeBasedThemeResult;
  applyTimeSuggestion: () => void;
  hasSuggestion: boolean;
  autoThemeSwitching: boolean;
  toggleAutoThemeSwitching: (value: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  suggestedTheme: null,
  suggestedThemeReason: "",
  getTimeBasedTheme: () => ({ theme: "system", reason: "" }),
  applyTimeSuggestion: () => null,
  hasSuggestion: false,
  autoThemeSwitching: false,
  toggleAutoThemeSwitching: () => null
};

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

// Function to get theme suggestion based on time of day with more context
const getTimeBasedThemeWithReason = (): TimeBasedThemeResult => {
  const currentHour = new Date().getHours();
  
  // Early morning (5am-8am): Light mode to help wake up
  if (currentHour >= 5 && currentHour < 8) {
    return { 
      theme: "light",
      reason: "Early morning light helps you wake up and start your day"
    };
  }
  // Working day (8am-5pm): Light mode for productivity
  else if (currentHour >= 8 && currentHour < 17) {
    return { 
      theme: "light",
      reason: "Daytime light mode enhances productivity and focus"
    };
  }
  // Evening transition (5pm-7pm): Light mode, but less important
  else if (currentHour >= 17 && currentHour < 19) {
    return { 
      theme: "light",
      reason: "Early evening light mode for finishing your daily tasks"
    };
  }
  // Evening (7pm-10pm): Dark mode for winding down
  else if (currentHour >= 19 && currentHour < 22) {
    return { 
      theme: "dark",
      reason: "Evening dark mode helps reduce eye strain as you wind down"
    };
  }
  // Night (10pm-5am): Dark mode for better sleep preparation
  else {
    return { 
      theme: "dark",
      reason: "Night time dark mode helps prepare for better sleep quality"
    };
  }
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light", // Changed default to light
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Always use light theme
  const [theme, setThemeState] = useState<Theme>("light");
  
  // Force light theme on initialization
  useEffect(() => {
    setLocalStorageItem(storageKey, "light");
    
    // Remove dark classes from document
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.dataset.theme = "light";
    
    console.log("Forcing light theme");
  }, []);
  
  // State for suggested theme and reason
  const [suggestedTheme, setSuggestedTheme] = useState<Theme | null>(null);
  const [suggestedThemeReason, setSuggestedThemeReason] = useState<string>("");
  
  // State for tracking when last suggestion was made
  const [lastSuggestionTime, setLastSuggestionTime] = useState<number>(() => {
    const savedTime = getLocalStorageItem("lastThemeSuggestionTime", "0");
    return Number(savedTime) || 0;
  });
  
  // State for auto-theme-switching
  const [autoThemeSwitching, setAutoThemeSwitching] = useState<boolean>(() => {
    const savedValue = getLocalStorageItem("auto-theme-switching", "false");
    return savedValue === "true";
  });
  
  // Function to set the theme
  const setTheme = (newTheme: Theme) => {
    // Save to localStorage
    setLocalStorageItem(storageKey, newTheme);
    
    // Update state
    setThemeState(newTheme);
    
    // When user explicitly sets theme, reset suggestion
    setSuggestedTheme(null);
    setSuggestedThemeReason("");
    
    // Update last suggestion time
    const newTime = Date.now();
    setLastSuggestionTime(newTime);
    setLocalStorageItem("lastThemeSuggestionTime", newTime.toString());
    
    console.log(`Theme changed to: ${newTheme}`);
  };
  
  // Toggle auto theme switching
  const toggleAutoThemeSwitching = (value: boolean) => {
    setAutoThemeSwitching(value);
    setLocalStorageItem("auto-theme-switching", value.toString());
  };
  
  // Determine if we should show a suggestion
  const hasSuggestion = !!suggestedTheme && suggestedTheme !== theme && !autoThemeSwitching;
  
  // Function to apply the time-based theme suggestion
  const applyTimeSuggestion = () => {
    if (suggestedTheme) {
      setTheme(suggestedTheme);
      // No need to reset suggestedTheme and suggestedThemeReason here
      // as setTheme already does that
    }
  };
  
  // Check for time-based theme suggestions
  useEffect(() => {
    const checkTimeSuggestion = () => {
      // Don't suggest if user explicitly chose a theme in the last 24 hours
      const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const currentTime = Date.now();
      
      // Only make a suggestion if it's been more than 24 hours since the last one
      // or if auto-switching is enabled
      if ((currentTime - lastSuggestionTime > oneDayMs) || autoThemeSwitching) {
        const timeBasedTheme = getTimeBasedThemeWithReason();
        
        // Get effective current theme (accounting for system preference)
        let effectiveTheme = theme;
        if (theme === "system") {
          effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
            ? "dark" 
            : "light";
        }
        
        // Only suggest if it's different from effective current theme
        if (timeBasedTheme.theme !== effectiveTheme) {
          if (autoThemeSwitching) {
            // If auto switching is enabled, apply the theme directly
            setTheme(timeBasedTheme.theme);
          } else {
            // Otherwise, just suggest it
            setSuggestedTheme(timeBasedTheme.theme);
            setSuggestedThemeReason(timeBasedTheme.reason);
          }
        } else {
          setSuggestedTheme(null);
          setSuggestedThemeReason("");
        }
      }
    };

    // Initial check on component mount
    checkTimeSuggestion();
    
    // Set up interval for regular checks - check every 15 minutes for more responsive suggestions
    const interval = setInterval(checkTimeSuggestion, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [theme, lastSuggestionTime, autoThemeSwitching]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // First remove both theme classes
    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    
    // Handle system theme preference
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
        ? "dark" 
        : "light";
    }
    
    // Add the appropriate class to the document
    root.classList.add(effectiveTheme);
    
    // Store the effective theme as a data attribute for debugging
    root.dataset.theme = effectiveTheme;
    
    // Listen for system preference changes if using system theme
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = () => {
        root.classList.remove("light", "dark");
        const newTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.add(newTheme);
        root.dataset.theme = newTheme;
      };
      
      mediaQuery.addEventListener("change", handleChange);
      
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    suggestedTheme,
    suggestedThemeReason,
    getTimeBasedTheme: getTimeBasedThemeWithReason,
    applyTimeSuggestion,
    hasSuggestion,
    autoThemeSwitching,
    toggleAutoThemeSwitching
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};