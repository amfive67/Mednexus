import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pine: { 700: "#0e5a44", 800: "#0a4635", 900: "#073527", 950: "#04241a" },
      },
      boxShadow: {
        clinical: "0 1px 2px rgb(6 78 59 / 0.05), 0 8px 24px -12px rgb(6 78 59 / 0.18)",
        lift: "0 2px 4px rgb(6 78 59 / 0.06), 0 16px 32px -16px rgb(6 78 59 / 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
