/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // CRITICAL: Scans all .js, .ts, .jsx, .tsx files in the src/ directory
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}