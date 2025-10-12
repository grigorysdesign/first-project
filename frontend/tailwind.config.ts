import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#5b5bff",
          600: "#4343f5"
        }
      }
    }
  },
  plugins: []
};

export default config;
