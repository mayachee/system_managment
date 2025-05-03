import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Avoid hydration mismatch by only rendering after mounting
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Show tooltip briefly after page load
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        
        // Hide after 3 seconds
        const hideTimer = setTimeout(() => {
          setShowTooltip(false);
        }, 3000);
        
        return () => clearTimeout(hideTimer);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [mounted]);
  
  if (!mounted) return null;
  
  const isDark = theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
    // Show tooltip briefly
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };
  
  // Spring animation for sun/moon icons
  const variants = {
    initial: { 
      rotate: isDark ? -45 : 45,
      scale: 0.2,
      opacity: 0
    },
    animate: { 
      rotate: 0,
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    },
    exit: { 
      rotate: isDark ? 45 : -45,
      scale: 0.2,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.button
      onClick={toggleTheme}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg no-transition
        ${isDark 
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-400 hover:to-blue-500" 
          : "bg-gradient-to-br from-yellow-400 to-amber-500 text-gray-900 hover:from-yellow-300 hover:to-amber-400"
        }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div
            key="sun"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="no-transition"
          >
            <Sun className="h-6 w-6" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="no-transition"
          >
            <Moon className="h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className={`absolute -top-12 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium no-transition
              ${isDark 
                ? "bg-slate-800 text-slate-200 border border-slate-700" 
                : "bg-white text-slate-900 border border-slate-200 shadow-sm"
              }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {isDark ? "Switch to light mode" : "Switch to dark mode"}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}