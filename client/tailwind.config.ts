import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090D",
          900: "#0C0E14",
          800: "#12141C",
          700: "#181B25",
          600: "#20232F",
          500: "#2A2E3C",
          400: "#3D4254",
        },
        mist: {
          100: "#F4F5F8",
          300: "#C7CBD6",
          500: "#8B90A3",
          700: "#5B5F70",
        },
        amber: {
          400: "#F5B942",
          500: "#E8A317",
        },
        teal: {
          400: "#2DD4BF",
          500: "#14B8A6",
        },
        rose: {
          400: "#FB7185",
          500: "#F43F5E",
        },
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
        },
        sky: {
          400: "#38BDF8",
          500: "#0EA5E9",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
