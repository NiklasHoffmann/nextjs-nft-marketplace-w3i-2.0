/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FFF9E2",
                secondary: "#1273EB",
                black: "#000000",
                lightBlack: "#101010",
                white: "#FFFFFF",
                whiteSemiTransparent: "rgba(255,255,255,0.9)",
                whiteTransparent: "rgba(255,255,255,0.7)",
                forestgreen: "#228B22",
                firebrick: "#B22222",
                orange: "#F3A108",
                orangeTransparent: "rgba(255,165,0,0.1)",
                hoverBlue: "#1273EB",
                hoverGrey: "#CCCCCC",
            },
            fontFamily: {
                primary: ["var(--font-poppins)", "system-ui", "sans-serif"],
                secondary: ["var(--font-roboto)", "system-ui", "sans-serif"],
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
