import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        vynedres: {
          black: "#0b0a08",
          gold: "#c9a962",
          goldlight: "#e4cf9a",
          golddeep: "#96712f",
          cream: "#f3eee4",
          charcoal: "#17140f",
          espresso: "#211c15",
          paper: "#f7f4ec",
          ink: "#211c14",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.35em",
      },
      backgroundImage: {
        "gold-sheen":
          "linear-gradient(135deg, #e4cf9a 0%, #c9a962 45%, #a9884a 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
