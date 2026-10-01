import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-soft": "var(--bg-soft)",
        panel: "var(--panel)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        pink: "var(--pink)",
        orange: "var(--orange)",
        white: "var(--white)",
      },
      fontFamily: {
        display: ["var(--font-abril)", "Georgia", "serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
