/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#121212",
        panel: "#1a1a1a",
        accent: "#b3452c",
      },
    },
  },
  plugins: [],
};
