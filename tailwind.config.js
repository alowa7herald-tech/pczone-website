
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(234 48% 4%)",
        foreground: "hsl(190 35% 96%)",
        primary: "hsl(184 100% 55%)",
        accent: "hsl(272 82% 62%)",
        destructive: "hsl(339 88% 60%)",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Chakra Petch", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
