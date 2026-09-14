import { heroui } from "@heroui/react";

/**
 * Streamify's design tokens.
 *
 * Dark is the default theme, so the dark palette is what :root resolves to and
 * next-themes only has to add `.light` to swap in the light one. Surfaces stay
 * near-black so the frosted panels (see the `glass*` utilities in globals.css)
 * have something deep to blur.
 */
export default heroui({
  defaultTheme: "dark",
  themes: {
    dark: {
      colors: {
        background: "#08080B",
        foreground: "#F5F5F7",
        primary: { DEFAULT: "#8B5CF6", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#D946EF", foreground: "#FFFFFF" },
        focus: "#8B5CF6",
        content1: "#131317",
        content2: "#1B1B21",
        content3: "#26262E",
        content4: "#32323C",
        default: { DEFAULT: "#26262E", foreground: "#F5F5F7" },
      },
    },
    light: {
      colors: {
        background: "#F4F4F6",
        foreground: "#1C1C1E",
        primary: { DEFAULT: "#7C3AED", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#C026D3", foreground: "#FFFFFF" },
        focus: "#7C3AED",
        content1: "#FFFFFF",
        content2: "#F1F1F3",
        content3: "#E3E3E7",
        content4: "#D2D2D8",
        default: { DEFAULT: "#E3E3E7", foreground: "#1C1C1E" },
      },
    },
  },
  layout: {
    radius: { small: "10px", medium: "14px", large: "20px" },
    disabledOpacity: 0.4,
  },
});
