/**
 * Inline glass styles.
 *
 * HeroUI's own surfaces (Modal, Dropdown, Popover, Tooltip) set their background
 * through Tailwind utilities, and adding a second background utility is a
 * coin-flip on CSS order. An inline style always wins, and referencing the CSS
 * variables keeps light mode working for free.
 */

const BLUR = "blur(34px) saturate(180%)";

export const glassSurface = {
  backgroundColor: "var(--color-glass-strong)",
  WebkitBackdropFilter: BLUR,
  backdropFilter: BLUR,
};

export const glassSoftSurface = {
  backgroundColor: "var(--color-glass)",
  WebkitBackdropFilter: BLUR,
  backdropFilter: BLUR,
};

/** Hairline border + top highlight, mixed for HeroUI popovers. */
export const glassBorder = {
  borderColor: "var(--color-hairline)",
};
