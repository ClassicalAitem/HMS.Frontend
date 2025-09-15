import React, { useState } from 'react';
import { IoIosColorPalette, IoMdClose } from 'react-icons/io';
import { FaCheck } from 'react-icons/fa';
import { useTheme } from '../../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeSwitcher = () => {
  const { currentTheme, changeTheme, availableThemes, themeDisplayNames } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme) => {
    changeTheme(theme);
    setIsOpen(false);
  };

  // Group themes by category for better organization
  const themeCategories = {
    'Standard': ['light', 'dark'],
    'Colorful': ['cupcake', 'bumblebee', 'emerald', 'corporate', 'valentine', 'garden', 'aqua', 'pastel', 'fantasy'],
    'Dark': ['synthwave', 'halloween', 'forest', 'black', 'luxury', 'dracula', 'night', 'coffee', 'dim'],
    'Unique': ['retro', 'cyberpunk', 'wireframe', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'winter', 'nord', 'sunset', 'lofi']
  };

  const ThemePreview = ({ theme }) => {
    return (
      <div
        className="cursor-pointer p-3 rounded-lg border-2 transition-all hover:scale-105"
        style={{
          backgroundColor: getThemeColors(theme).base100,
          borderColor: currentTheme === theme ? '#00943C' : getThemeColors(theme).base300,
          color: getThemeColors(theme).baseContent
        }}
        onClick={() => handleThemeChange(theme)}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{themeDisplayNames[theme]}</span>
          {currentTheme === theme && (
            <FaCheck className="w-4 h-4 text-green-500" />
          )}
        </div>
        
        {/* Theme Preview Colors */}
        <div className="flex space-x-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getThemeColors(theme).primary }}
          ></div>
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getThemeColors(theme).secondary }}
          ></div>
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getThemeColors(theme).accent }}
          ></div>
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: getThemeColors(theme).neutral }}
          ></div>
        </div>
      </div>
    );
  };

  // Comprehensive DaisyUI theme color mapping
  const getThemeColors = (theme) => {
    const themeColorMap = {
      light: { primary: '#00943C', secondary: '#f000b8', accent: '#00943C', neutral: '#3d4451', base100: '#ffffff', base300: '#00943C', baseContent: '#1f2937' },
      dark: { primary: '#22c55e', secondary: '#f000b8', accent: '#37cdbe', neutral: '#2a2e37', base100: '#1f2937', base300: '#374151', baseContent: '#f9fafb' },
      cupcake: { primary: '#65c3c8', secondary: '#ef9fbc', accent: '#eeaf3a', neutral: '#291334', base100: '#faf7f5', base300: '#e7e2df', baseContent: '#291334' },
      bumblebee: { primary: '#f9d71c', secondary: '#df7e07', accent: '#181830', neutral: '#181a2a', base100: '#fffbeb', base300: '#e4e4e7', baseContent: '#181a2a' },
      emerald: { primary: '#66cc8a', secondary: '#377cfb', accent: '#ea5234', neutral: '#333c4d', base100: '#ffffff', base300: '#d1d5db', baseContent: '#333c4d' },
      corporate: { primary: '#4b6bfb', secondary: '#7b92b3', accent: '#67cba0', neutral: '#181a2a', base100: '#ffffff', base300: '#e5e7eb', baseContent: '#181a2a' },
      synthwave: { primary: '#e779c1', secondary: '#58c7f3', accent: '#f3cc30', neutral: '#20134e', base100: '#1a0b2e', base300: '#451a6b', baseContent: '#f7d794' },
      retro: { primary: '#ef9995', secondary: '#a4cbb4', accent: '#dc8850', neutral: '#2f2f2f', base100: '#ede6db', base300: '#b8b8b8', baseContent: '#2f2f2f' },
      cyberpunk: { primary: '#ff7598', secondary: '#75d1f0', accent: '#c07eec', neutral: '#1d232a', base100: '#0d1117', base300: '#454c59', baseContent: '#f7ee7f' },
      valentine: { primary: '#e96d7b', secondary: '#a991f7', accent: '#88dbdd', neutral: '#af4670', base100: '#f0d6db', base300: '#c5a7ab', baseContent: '#632c3b' },
      halloween: { primary: '#f28c18', secondary: '#6d3a9c', accent: '#51a800', neutral: '#1b1d1d', base100: '#1f2124', base300: '#53565a', baseContent: '#f4c152' },
      garden: { primary: '#5c7f67', secondary: '#ecf4e7', accent: '#fae5e5', neutral: '#5d5d5d', base100: '#ffffff', base300: '#e5e6e6', baseContent: '#5d5d5d' },
      forest: { primary: '#1eb854', secondary: '#1db584', accent: '#1db5a6', neutral: '#19362d', base100: '#171212', base300: '#2a2e2a', baseContent: '#e0e7e0' },
      aqua: { primary: '#09ecf3', secondary: '#966fb3', accent: '#fbbf24', neutral: '#3b424e', base100: '#ffffff', base300: '#ebeef3', baseContent: '#3b424e' },
      lofi: { primary: '#0d0d0d', secondary: '#1a1a1a', accent: '#262626', neutral: '#0a0a0a', base100: '#fafafa', base300: '#e6e6e6', baseContent: '#0d0d0d' },
      pastel: { primary: '#d1c1d7', secondary: '#f6cbd1', accent: '#b4e9d6', neutral: '#70acc7', base100: '#ffffff', base300: '#e6e7e8', baseContent: '#70acc7' },
      fantasy: { primary: '#6e0b75', secondary: '#007ebd', accent: '#f2b138', neutral: '#1f2937', base100: '#ffffff', base300: '#e5e7eb', baseContent: '#1f2937' },
      wireframe: { primary: '#b8b8b8', secondary: '#b8b8b8', accent: '#b8b8b8', neutral: '#b8b8b8', base100: '#ffffff', base300: '#000000', baseContent: '#000000' },
      black: { primary: '#343232', secondary: '#343232', accent: '#343232', neutral: '#2a2e37', base100: '#000000', base300: '#343232', baseContent: '#a6adba' },
      luxury: { primary: '#ffffff', secondary: '#152747', accent: '#513448', neutral: '#2a2e37', base100: '#09090b', base300: '#2e2d2f', baseContent: '#ffffff' },
      dracula: { primary: '#ff79c6', secondary: '#bd93f9', accent: '#ffb86c', neutral: '#414558', base100: '#282a36', base300: '#414558', baseContent: '#f8f8f2' },
      cmyk: { primary: '#45AEEE', secondary: '#E8488A', accent: '#FFF04A', neutral: '#291334', base100: '#ffffff', base300: '#e5e6e6', baseContent: '#100f0f' },
      autumn: { primary: '#8C0327', secondary: '#D85251', accent: '#D59B6A', neutral: '#826A5C', base100: '#f1f1f0', base300: '#cdcdc8', baseContent: '#826A5C' },
      business: { primary: '#1C4E80', secondary: '#7C909A', accent: '#EA6947', neutral: '#23282f', base100: '#ffffff', base300: '#e5e6e6', baseContent: '#1f2937' },
      acid: { primary: '#ff00f4', secondary: '#ff7400', accent: '#00ffff', neutral: '#2a2e37', base100: '#fafafa', base300: '#e2e5e9', baseContent: '#2a2e37' },
      lemonade: { primary: '#519903', secondary: '#e9e92f', accent: '#ff9900', neutral: '#8b8680', base100: '#ffffff', base300: '#e2e5e9', baseContent: '#8b8680' },
      night: { primary: '#38bdf8', secondary: '#818cf8', accent: '#f471b5', neutral: '#1e293b', base100: '#0f172a', base300: '#253344', baseContent: '#a6adba' },
      coffee: { primary: '#DB924B', secondary: '#263E3F', accent: '#10576D', neutral: '#213547', base100: '#20161F', base300: '#342B28', baseContent: '#A6A2A2' },
      winter: { primary: '#047AED', secondary: '#463AA2', accent: '#C148AC', neutral: '#2a2e37', base100: '#ffffff', base300: '#e5e6e6', baseContent: '#394e6a' },
      dim: { primary: '#9333ea', secondary: '#f472b6', accent: '#0ea5e9', neutral: '#2a323c', base100: '#2a323c', base300: '#4b5563', baseContent: '#a6adba' },
      nord: { primary: '#5e81ac', secondary: '#81a1c1', accent: '#88c0d0', neutral: '#4c566a', base100: '#2e3440', base300: '#4c566a', baseContent: '#eceff4' },
      sunset: { primary: '#f97316', secondary: '#84cc16', accent: '#8b5cf6', neutral: '#57534e', base100: '#fef7ed', base300: '#fed7aa', baseContent: '#57534e' }
    };
    
    return themeColorMap[theme] || themeColorMap.light;
  };

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle"
        title="Change Theme"
      >
        <IoIosColorPalette className="w-5 h-5" />
      </button>

      {/* Theme Selector Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute right-0 top-12 bg-base-100 rounded-lg shadow-xl border border-base-300 p-6 w-96 max-h-96 overflow-y-auto z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-base-content">Choose Theme</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-base-content/40 hover:text-base-content/70 transition-colors"
          >
            <IoMdClose className="w-5 h-5" />
          </button>
        </div>

              {/* Current Theme */}
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-base-content/70">Current Theme:</p>
                <p className="font-medium text-primary">{themeDisplayNames[currentTheme]}</p>
              </div>

              {/* Theme Categories */}
              {Object.entries(themeCategories).map(([category, themes]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-medium text-base-content mb-3">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {themes.map((theme) => (
                      <ThemePreview key={theme} theme={theme} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
