/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    colors: {
      green: "#16a34a",
      "light-green": "#22c55e",
      white: "#fff",
      gray: "#D9D9D9",
      "light-gray": "#f9fafb",
      "very-light-gray": "#F7F8FA",
      "dark-gray": "#6b7280",
      background: "#f2f2f2",
      dark: "#0F172A",
      "light-red": "#EF8989",
      blue: "#0060df",
      transparent: "transparent",
      overlay: "rgba(0,0,0,.4)",
      danger: "#ff0000",
      gold: "#f6b01e",
    },
    fontFamily: {
      montserrat: ["Montserrat", "sans-serif"],
    },
    fontSize: {
      "3xl": "2rem", //32px
      "2xl": "1.5rem", //24px
      xl: "1.5rem", //22px
      lg: "1.25rem", //20px
      md: "1.125rem", //18px
      base: "1rem", //16px
      sm: "0.875rem", //14px
      xs: "0.75rem", //12px
      "2xs": "0.688rem", //11px
    },
    screens: {
      "2xs": "28rem", //448px
      xs: "33.75rem", //540px
      sm: "40rem", //640px
      md: "48rem", //768px
      lg: "64rem", //1024px
      sxl: "73.25rem",
      xl: "80rem", //1280px
      "2xl": "96rem", //1536px
    },
    extend: {
      maxWidth: {
        "8xl": "90rem", //1440px
        38: "9.375rem", //150px
        180: "11.25rem", //180px
      },
      lineClamp: {
        7: "7",
      },
      spacing: {
        0: "0px", //0px
        1.25: "0.188rem", //3px
        1.3: "clamp(0.25rem, 0.2283rem + 0.1087vi, 0.3125rem)", //4px 5px
        "2xs": "clamp(0.5rem, 0.4565rem + 0.2174vi, 0.625rem)", // 8px 10px
        xs: "clamp(0.75rem, 0.6848rem + 0.3261vi, 0.9375rem)", //12px 16px
        3.7: "0.938rem", //15px
        5.5: "1.563rem", //25px
        s: "clamp(1rem, 0.913rem + 0.4348vi, 1.25rem)", // 16px 20px
        m: "clamp(1.5rem, 1.3696rem + 0.6522vi, 1.875rem)", // 24px 30px
        l: "clamp(2rem, 1.8261rem + 0.8696vi, 2.5rem)", // 32px 40px
        9: "2.25rem", //36px
        10.5: "3.125rem", //50px
        xl: "clamp(3rem, 2.7391rem + 1.3043vi, 3.75rem)", // 48px 60px
        "2xl": "clamp(4rem, 3.6522rem + 1.7391vi, 5rem)", // 64px 80px
        "3xl": "clamp(6rem, 5.4783rem + 2.6087vi, 7.5rem)", // 96px 120px
        full: "100%", //100%
      },
      height: {
        8.5: "2.313rem", //37px
        10.3: "2.625rem", //42px
        15: "3.125rem", //50px
        30: "7.5rem", //120px
        54: "13.75rem", //220px
      },
      width: {
        53: "13.625rem", //218px
        34: "8.25rem", //132px
        16.5: "4.375rem", //70px
        30: "7.5rem", //120px
        75: "18.75rem", //300px
        120: "25rem", //400px
        15: "3.75rem", //60px
      },
      boxShadow: {
        box: "0 0 8px -2px rgba(0, 0, 0, 0.1), 0 6px 20px -3px rgba(0, 0, 0, 0.2)",
      },
      maxHeight: {
        120: "25rem", //400px
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/forms"),
    function ({ addUtilities }) {
      addUtilities({
        ".hide-scrollbar": {
          "::-webkit-scrollbar": {
            display: "none",
          },
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none", // Firefox
        },
      });
    },
  ],
};
