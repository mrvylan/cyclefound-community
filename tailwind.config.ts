import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#10171B",
          soft: "#303737",
          muted: "#737772",
          2: "#1A2226",
          3: "#2A3236",
        },
        ground: "#F8F7F4",
        surface: "#FFFFFF",
        line: {
          DEFAULT: "#E5E5DF",
          soft: "#EEEDE8",
        },
        muted: {
          DEFAULT: "#737772",
          2: "#525651",
        },
        "on-dark-muted": "#B8BCC2",
        accent: {
          DEFAULT: "#527D31",
          hover: "#466C29",
          bright: "#6F963B",
          soft: "#EEF3E8",
          "soft-border": "#C5D6B5",
        },
        blue: {
          DEFAULT: "#1E40AF",
          soft: "#EEF2FF",
        },
        "status-sale": "var(--status-sale)",
        "status-offers": "var(--status-offers)",
        "status-offers-soft": "var(--status-offers-soft)",
        "status-accepted": "var(--status-accepted)",
        "status-accepted-soft": "var(--status-accepted-soft)",
        "status-accepted-border": "var(--status-accepted-border)",
        "value-up": "var(--value-up)",
        "value-down": "var(--value-down)",
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
