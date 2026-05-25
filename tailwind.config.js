/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pita: {
          feldgrau:   '#525F54',
          feldgrauDk: '#3d4a3f',
          feldgrauLt: '#6b7a6d',
          peach:      '#FABD97',
          peachDk:    '#f09e6a',
          peachLt:    '#fdd8bc',
          asparagus:  '#6CAE75',
          asparagusLt:'#a8d4ad',
          offwhite:   '#FAF8F5',
          grayLt:     '#f0ede8',
          grayMid:    '#c5bfb6',
        },
        candy: {
          pink:     '#FFF0F5',
          darkpink: '#FFB6C1',
          mint:     '#E0FFFF',
          cream:    '#FFFDD0',
          text:     '#4A3B32',
        },
      },
      fontFamily: {
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        sans:  ['"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
