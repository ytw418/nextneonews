import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        gray: {
          100: "var(--gray-100)",
          200: "var(--gray-200)",
          400: "var(--gray-400)",
          600: "var(--gray-600)",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            img: {
              margin: "2rem auto",
            },
            p: {
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
  darkMode: "media",
};

export default config;
