/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette personalizzata Warframe
        wf: {
          dark: '#0a0a0a',       // Sfondo principale (quasi nero)
          panel: '#15191e',      // Sfondo delle card
          gold: '#d4af37',       // Oro Orokin classico
          'gold-light': '#f1c40f', // Oro acceso per hover
          energy: '#3b82f6',     // Blu energia
          text: '#e2e8f0',       // Testo leggibile (bianco sporco)
          muted: '#64748b',      // Testo secondario
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};