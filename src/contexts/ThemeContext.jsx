import React, { createContext, useContext, useState, useEffect } from 'react';

// Available DaisyUI themes
export const AVAILABLE_THEMES = [
  'light',
  'dark', 
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset'
];

// Theme display names for better UX
export const THEME_DISPLAY_NAMES = {
  light: 'Light',
  dark: 'Dark',
  cupcake: 'Cupcake',
  bumblebee: 'Bumblebee',
  emerald: 'Emerald',
  corporate: 'Corporate',
  synthwave: 'Synthwave',
  retro: 'Retro',
  cyberpunk: 'Cyberpunk',
  valentine: 'Valentine',
  halloween: 'Halloween',
  garden: 'Garden',
  forest: 'Forest',
  aqua: 'Aqua',
  lofi: 'Lo-Fi',
  pastel: 'Pastel',
  fantasy: 'Fantasy',
  wireframe: 'Wireframe',
  black: 'Black',
  luxury: 'Luxury',
  dracula: 'Dracula',
  cmyk: 'CMYK',
  autumn: 'Autumn',
  business: 'Business',
  acid: 'Acid',
  lemonade: 'Lemonade',
  night: 'Night',
  coffee: 'Coffee',
  winter: 'Winter',
  dim: 'Dim',
  nord: 'Nord',
  sunset: 'Sunset'
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('hms-theme');
    if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('light');
    }
  }, []);

  // Apply theme to HTML element
  const applyTheme = (theme) => {
    // Set theme on HTML element - this is how DaisyUI expects it
    document.documentElement.setAttribute('data-theme', theme);
    
    // Debug log to see if theme is being applied
    console.log('Theme applied:', theme, 'HTML data-theme:', document.documentElement.getAttribute('data-theme'));
  };

  // Change theme function
  const changeTheme = (newTheme) => {
    if (AVAILABLE_THEMES.includes(newTheme)) {
      console.log('Changing theme from', currentTheme, 'to', newTheme);
      setCurrentTheme(newTheme);
      applyTheme(newTheme);
      localStorage.setItem('hms-theme', newTheme);
      
      // Double-check that the theme was applied
      setTimeout(() => {
        const appliedTheme = document.documentElement.getAttribute('data-theme');
        console.log('Theme verification - Expected:', newTheme, 'Actual:', appliedTheme);
      }, 100);
    } else {
      console.error('Theme not available:', newTheme, 'Available themes:', AVAILABLE_THEMES);
    }
  };

  // Get next theme (for theme cycling)
  const getNextTheme = () => {
    const currentIndex = AVAILABLE_THEMES.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
    return AVAILABLE_THEMES[nextIndex];
  };

  // Cycle to next theme
  const cycleTheme = () => {
    const nextTheme = getNextTheme();
    changeTheme(nextTheme);
  };

  // Check if current theme is dark
  const isDarkTheme = () => {
    const darkThemes = ['dark', 'synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'night', 'coffee', 'dim'];
    return darkThemes.includes(currentTheme);
  };

  const value = {
    currentTheme,
    changeTheme,
    cycleTheme,
    isDarkTheme,
    availableThemes: AVAILABLE_THEMES,
    themeDisplayNames: THEME_DISPLAY_NAMES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
