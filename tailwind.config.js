/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "unbounded-variable": ["UnboundedVariable", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        titillium: ['TitilliumWeb', 'sans-serif']
      },
      colors: {
        pink: "#E6007A",
        purple: {
          400: "#6D3AEE",
          500: "#6D3AEE",
          600: "#442299",
        },
        cyan: {
          500: "#00B2FF",
          600: "#00A6ED",
          700: "#0094D4",
        },
        green: {
          500: "#56F39A",
          600: "#51E591",
          700: "#48CC81",
        },
        lime: {
          500: "#D3FF33",
          600: "#BEE52E",
          700: "#A9CC29",
        },
        "purple-dark": {
          700: "#321D47",
          800: "#28123E",
          900: "#1C0533",
          925: "#160527",
          950: "#140523",
        },
        "purple-light": {
          50: "#FBFCFE",
          100: "#F3F5FB",
          200: "#E6EAF6",
          300: "#DAE0F2",
        },
        "text-color": {
          "header-light": "#000000E5",
          "body-light": "#000000B2",
          "label-light": "#00000080",
          "disabled-light": "#00000059",
          "header-dark": "#FFFFFFE5",
          "body-dark": "#FFFFFFB2",
          "label-dark": "#FFFFFF80",
          "disabled-dark": "#FFFFFF59",
        },
        "modal-header-border-color": "#0000000F",
        "modal-border-color": "#FFFFFF4D"
      },
      boxShadow: {
        "modal-box-shadow": "0px 0px 0px 0px rgba(226, 228, 233, 0.10), 3px 12px 27px 0px rgba(226, 228, 233, 0.10), 13px 48px 50px 0px rgba(226, 228, 233, 0.09), 29px 108px 67px 0px rgba(226, 228, 233, 0.05), 52px 193px 80px 0px rgba(226, 228, 233, 0.01), 82px 301px 87px 0px rgba(226, 228, 233, 0.00)",
      },
      fontSize: {
        "heading-1": "48px",
        "heading-2": "40px",
        "heading-3": "33px",
        "heading-4": "28px",
        "heading-5": "23px",
        "heading-6": "19px",
        "extra-large": "18px",
        large: "16px",
        medium: "13px",
        small: "11px",
        "modal-header-text": "19px",
      },
    },
  },
  plugins: [],
};
