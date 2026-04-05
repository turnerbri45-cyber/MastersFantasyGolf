import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "masters-green": "#1a5c38",
        "masters-green-dark": "#0f3d24",
        "masters-green-light": "#2d7a4f",
        "masters-yellow": "#f0c04e",
        "masters-yellow-light": "#f7d98a",
        "masters-cream": "#fdf6e3",
        "masters-bg": "#0a1f13",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
