/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // You can extend theme here if needed
      colors: {
        primary: "#2563eb", // blue-600
        secondary: "#64748b", // slate-500
      },
    },
  },
  plugins: [],
}
