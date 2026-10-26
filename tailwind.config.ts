import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0097A7",
          50: "#E6F7F9",
          100: "#CCEFF2",
          200: "#99DFE6",
          300: "#66CFD9",
          400: "#33BFCD",
          500: "#0097A7",
          600: "#007A87",
          700: "#005C65",
          800: "#003D44",
          900: "#001F22",
        },
        accent: {
          DEFAULT: "#F9A825",
          50: "#FEF6E7",
          100: "#FDEDCE",
          200: "#FBDB9D",
          300: "#F9C96C",
          400: "#F7B73B",
          500: "#F9A825",
          600: "#C7861D",
          700: "#956516",
          800: "#64430E",
          900: "#322207",
        },
        background: "#F8FAFA",
        surface: "#FFFFFF",
        ink: "#1A1A16",
        text: {
          DEFAULT: "#1F2937",
          muted: "#6B7280",
        },
        border: "#E5E7EB",
        status: {
          received: "#0EA5E9",
          confirmed: "#0097A7",
          preparing: "#F59E0B",
          outForDelivery: "#3B82F6",
          delivered: "#16A34A",
          cancelled: "#DC2626",
        },
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #33BFCD 0%, #0097A7 55%, #005C65 100%)",
        "gradient-brand-soft": "linear-gradient(135deg, #66CFD9 0%, #0097A7 100%)",
        "gradient-brand-radial": "radial-gradient(circle at 20% 20%, #33BFCD 0%, #0097A7 45%, #003D44 100%)",
        "gradient-brand-vertical": "linear-gradient(180deg, #0097A7 0%, #005C65 100%)",
        "gradient-accent": "linear-gradient(135deg, #F9C96C 0%, #F9A825 60%, #C7861D 100%)",
        "gradient-surface": "linear-gradient(180deg, #E6F7F9 0%, #FFFFFF 100%)",
        "gradient-status-received": "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
        "gradient-status-confirmed": "linear-gradient(135deg, #33BFCD 0%, #0097A7 100%)",
        "gradient-status-preparing": "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
        "gradient-status-outForDelivery": "linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)",
        "gradient-status-delivered": "linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)",
        "gradient-status-cancelled": "linear-gradient(135deg, #F87171 0%, #DC2626 100%)",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "DM Sans", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
      borderRadius: {
        card: "20px",
        sheet: "28px",
        pill: "3rem",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgb(31 41 55 / 0.06), 0 1px 2px -1px rgb(31 41 55 / 0.04)",
        card: "0 4px 16px -4px rgb(31 41 55 / 0.08)",
        lifted: "0 12px 32px -8px rgb(31 41 55 / 0.16)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        "sheet-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 250ms cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 200ms ease-out",
        "scale-in": "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        pop: "pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
