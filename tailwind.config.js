/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // <--- IMPORTANT: Stops auto-dark mode
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}", // <--- Added this extra catch-all line
    ],
    theme: {
      extend: {
        colors: {
          brand: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            500: '#0ea5e9',
            600: '#0284c7',
            900: '#0c4a6e',
          }
        }
      },
    },
    plugins: [
      require('@tailwindcss/forms'),
    ],
  };