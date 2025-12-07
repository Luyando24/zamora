import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zambia: {
          green: '#198a00', // Flag green
          red: '#de2010',   // Flag red
          black: '#000000', // Flag black
          orange: '#ef7d00',// Flag orange/copper
          copper: '#b87333', // Metallic copper
          earth: '#8B4513',  // Earth tone
          blue: '#004e92',   // Dashboard Blue
        },
      },
    },
  },
  plugins: [],
};
export default config;
