import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#15171A",
          2: "#202328",
          3: "#2B2F34",
        },
        ground: "#F3F3F0",
        surface: "#FFFFFF",
        line: {
          DEFAULT: "#DEDDD8",
          soft: "#ECEBE7",
        },
        muted: {
          DEFAULT: "#5B6068",
          2: "#4A4F57",
        },
        "on-dark-muted": "#B8BCC2",
        accent: {
          DEFAULT: "#C2410C",
          hover: "#9A3412",
          bright: "#F97316",
          soft: "#FFF7ED",
          "soft-border": "#FED7AA",
        },
        blue: {
          DEFAULT: "#1E40AF",
          soft: "#EEF2FF",
        },
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
      },
      maxWidth: {
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
