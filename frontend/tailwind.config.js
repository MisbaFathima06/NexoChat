import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        "whatsapp-light": {
          primary: "#25D366",
          "primary-content": "#FFFFFF",
          secondary: "#128C7E",
          "secondary-content": "#FFFFFF",
          accent: "#34B7F1",
          neutral: "#111B21",
          "neutral-content": "#E9EDEF",
          "base-100": "#E9EDEF",
          "base-200": "#D1D7DB",
          "base-300": "#C4CBCF",
          "base-content": "#111B21",
          info: "#34B7F1",
          success: "#25D366",
          warning: "#FFB347",
          error: "#F15C5C",
        },
      },
      {
        "whatsapp-dark": {
          primary: "#25D366",
          "primary-content": "#0B141A",
          secondary: "#0A332C",
          "secondary-content": "#E9EDEF",
          accent: "#34B7F1",
          neutral: "#1F2C34",
          "neutral-content": "#E9EDEF",
          "base-100": "#0B141A",
          "base-200": "#111B21",
          "base-300": "#1F2C34",
          "base-content": "#E9EDEF",
          info: "#34B7F1",
          success: "#25D366",
          warning: "#FFB347",
          error: "#F15C5C",
        },
      },
    ],
  },
};