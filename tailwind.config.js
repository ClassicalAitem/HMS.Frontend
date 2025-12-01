/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom green primary color that will be used across all themes
        'green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00943C', // Main green color
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        }
      },
      fontFamily: {
        // Add Google Fonts - Updated to use Poppins
        'sans': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'body': ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  // DaisyUI is now configured in index.css with @plugin directive
  // No plugins needed in tailwind.config.js for Tailwind 4
};
