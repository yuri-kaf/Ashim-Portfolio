/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './{pages,components,lib}/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
