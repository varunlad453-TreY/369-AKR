/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#FFD23F", // Primary 369 AKR Brand Yellow
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        obsidian: {
          950: "#06090e",
          900: "#0B0F19",
          850: "#0f172a",
          800: "#131d31",
          700: "#1e293b",
          600: "#334155",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      backgroundImage: {
        "solar-radial": "radial-gradient(circle at 50% 0%, rgba(255, 210, 63, 0.15), transparent 70%)",
        "grid-pattern": "radial-gradient(rgba(255, 210, 63, 0.08) 1px, transparent 1px)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(255, 210, 63, 0.2), inset 0 0 5px rgba(255, 210, 63, 0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(255, 210, 63, 0.6), inset 0 0 10px rgba(255, 210, 63, 0.3)" },
        },
      },
    },
  },
  plugins: [],
};
