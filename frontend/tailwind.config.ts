import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf6",
          100: "#d6f7e8",
          400: "#34c78a",
          500: "#1fa971",
          600: "#178a5c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
