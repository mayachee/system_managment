import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  suggestedTheme: Theme | null;
  getTimeBasedTheme: () => Theme;
  applyTimeSuggestion: () => void;
  hasSuggestion: boolean;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  suggestedTheme: null,
  getTimeBasedTheme: () => "system",
  applyTimeSuggestion: () => null,
  hasSuggestion: false,
};

// Function to get theme suggestion based on time of day
const getTimeBasedTheme = (): Theme => {
  const currentHour = new Date().getHours();
  
  // Night time (7pm-5am): Dark mode
  if (currentHour >= 19 || currentHour < 5) {
    return "dark";
  }
  // Day time (5am-7pm): Light mode
  else {
    return "light";
  }
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

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme from localStorage or use default
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = getLocalStorageItem(storageKey, defaultTheme);
    return (savedTheme as Theme) || defaultTheme;
  });
  
  const [suggestedTheme, setSuggestedTheme] = useState<Theme | null>(null);
  const [lastSuggestionTime, setLastSuggestionTime] = useState<number>(() => {
    const savedTime = getLocalStorageItem("lastThemeSuggestionTime", "0");
    return Number(savedTime) || 0;
  });

  // Check for time-based theme suggestions
  useEffect(() => {
    const checkTimeSuggestion = () => {
      // Don't suggest if user explicitly chose a theme in the last 24 hours
      const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const currentTime = Date.now();
      
      // Only make a suggestion if it's been more than 24 hours since the last one
      if (currentTime - lastSuggestionTime > oneDayMs) {
        const timeTheme = getTimeBasedTheme();
        
        // Get effective current theme (accounting for system preference)
        let effectiveTheme = theme;
        if (theme === "system") {
          effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches 
            ? "dark" 
            : "light";
        }
        
        // Only suggest if it's different from effective current theme
        if (timeTheme !== effectiveTheme) {
          setSuggestedTheme(timeTheme);
        } else {
          setSuggestedTheme(null);
        }
      }
    };

    // Initial check on component mount
    checkTimeSuggestion();
    
    // Set up interval for regular checks
    const interval = setInterval(checkTimeSuggestion, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, [theme, lastSuggestionTime]);

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

  // Determine if we should show a suggestion
  const hasSuggestion = !!suggestedTheme && suggestedTheme !== theme;

  // Function to apply the time-based theme suggestion
  const applyTimeSuggestion = () => {
    if (suggestedTheme) {
      setTheme(suggestedTheme);
      setSuggestedTheme(null);
      const newTime = Date.now();
      setLastSuggestionTime(newTime);
      setLocalStorageItem("lastThemeSuggestionTime", newTime.toString());
    }
  };

  // Function to set the theme
  const setTheme = (newTheme: Theme) => {
    // Save to localStorage
    setLocalStorageItem(storageKey, newTheme);
    
    // Update state
    setThemeState(newTheme);
    
    // When user explicitly sets theme, reset suggestion
    setSuggestedTheme(null);
    const newTime = Date.now();
    setLastSuggestionTime(newTime);
    setLocalStorageItem("lastThemeSuggestionTime", newTime.toString());
    
    console.log(`Theme changed to: ${newTheme}`);
  };

  const value = {
    theme,
    setTheme,
    suggestedTheme,
    getTimeBasedTheme,
    applyTimeSuggestion,
    hasSuggestion,
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
