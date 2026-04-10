/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4A90D9",
        secondary: "#6FCF97",
        accent: "#F2994A",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        error: "#EB5757",
        textPrimary: "#1A1A2E",
        textSecondary: "#6B7280",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
