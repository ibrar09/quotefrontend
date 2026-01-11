/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        purpleCustom: "#4c1a57",
        tealCustom: "#00a8aa",
        cream: "#fffbea",
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #4c1a57 0%, #00a8aa 100%)',
        'dashboard-gradient': 'linear-gradient(135deg, #4c1a57 0%, #00a8aa 100%)',
      },
    },
  },
  plugins: [],
};
