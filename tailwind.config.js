module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Sans'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        accent: "#f59e0b",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
};
