
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const THEME_PHASES = {
  MORNING: "morning", // 6-12
  DAY: "day",         // 12-17
  EVENING: "evening", // 17-20
  NIGHT: "night",     // 20-6
};

// Gradients matching the phases
export const PHASE_STYLES = {
  morning: {
    label: "Morning",
    gradient: "from-orange-500/20 via-rose-500/10 to-amber-500/20",
    accent: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    heroGradient: "from-orange-400/20 via-rose-400/10 to-amber-300/20",
    orb1: "bg-orange-500/20",
    orb2: "bg-rose-500/20",
  },
  day: {
    label: "Day",
    gradient: "from-sky-600/20 via-background to-blue-600/20", // Existing default
    accent: "text-sky-500",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    heroGradient: "from-sky-600/20 via-background to-blue-600/20",
    orb1: "bg-sky-600/20",
    orb2: "bg-blue-600/20",
  },
  evening: {
    label: "Evening",
    gradient: "from-violet-600/20 via-fuchsia-600/10 to-indigo-600/20",
    accent: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    heroGradient: "from-violet-600/20 via-fuchsia-600/10 to-indigo-600/20",
    orb1: "bg-violet-600/20",
    orb2: "bg-fuchsia-600/20",
  },
  night: {
    label: "Night",
    gradient: "from-indigo-900/40 via-slate-900/40 to-blue-900/40",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    heroGradient: "from-indigo-900/40 via-background to-blue-900/40",
    orb1: "bg-indigo-600/20",
    orb2: "bg-blue-900/20",
  },
};

export function ThemeProvider({ children }) {
  const [phase, setPhase] = useState(THEME_PHASES.DAY);

  const calculatePhase = () => {
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 12) return THEME_PHASES.MORNING;
    if (hour >= 12 && hour < 17) return THEME_PHASES.DAY;
    if (hour >= 17 && hour < 20) return THEME_PHASES.EVENING;
    return THEME_PHASES.NIGHT;
  };

  useEffect(() => {
    // Initial set
    setPhase(calculatePhase());

    // Check every minute
    const interval = setInterval(() => {
      setPhase(calculatePhase());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // For debugging/demo purposes, allow manual override via window
  useEffect(() => {
    window.setThemePhase = (p) => {
        if (Object.values(THEME_PHASES).includes(p)) {
            setPhase(p);
            console.log("Theme phase manually set to:", p);
        }
    };
  }, []);

  const styles = PHASE_STYLES[phase];

  return (
    <ThemeContext.Provider value={{ phase, styles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
