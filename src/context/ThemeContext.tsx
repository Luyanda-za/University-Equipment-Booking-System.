// Import React tools for creating context, managing state, and running effects.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Define the available theme options.
type ThemeMode = 'light' | 'dark' | 'system';

// Specify the values and functions that the theme context makes available to components.
interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

// Create a context to share theme settings throughout the application.
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Check whether the user's operating system currently prefers dark mode.
function getSystemDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Apply the selected appearance by adding or removing the dark-mode CSS class.
function applyTheme(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Provide theme settings to all child components in the application.
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Load the saved theme preference, using system settings if none is stored.
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    return stored ?? 'system';
  });

  // Determine the initial dark-mode state from the saved preference or system setting.
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('theme') as ThemeMode | null;
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    return getSystemDark();
  });

  // Update the dark-mode state and page styling whenever the selected theme changes.
  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && getSystemDark());
    setIsDark(dark);
    applyTheme(dark);
  }, [theme]);

  // When using system mode, listen for changes to the operating system's appearance.
  useEffect(() => {
    // No listener is needed when the user explicitly selects light or dark mode.
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Update the application theme when the system preference changes.
    const handler = () => {
      const dark = getSystemDark();
      setIsDark(dark);
      applyTheme(dark);
    };

    // Register the listener and remove it when the effect is cleaned up.
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Save the user's theme selection in state and browser storage.
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Make the current theme and its controls available to child components.
  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Allow components to access the theme context through a custom React hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);

  // Throw a clear error if the hook is used outside ThemeProvider.
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');

  return ctx;
}
