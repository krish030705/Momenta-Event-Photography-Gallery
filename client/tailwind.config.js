/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // A calm, professional palette for a photography SaaS product --
        // deep ink for text, a soft accent for primary actions.
        ink: "#1a1a2e",
        accent: "#6366f1",
      },
    },
  },
  plugins: [],
};
