import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#185FA5",
        danger: "#A32D2D",
        success: "#0F6E56",
        "vault-a": "#185FA5",
        "vault-b": "#0F6E56",
        sidebar: "#F5F5F5",
      },
      fontFamily: {
        sans: [
          "Malgun Gothic",
          "Apple SD Gothic Neo",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
