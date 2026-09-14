/**
 * The Streamify mark. The path is unchanged from the original logo — only how it
 * is presented (solid primary, or knocked out of a gradient tile) differs.
 */

export function LogoMark({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size * (211 / 176)}
      viewBox="0 0 176 211"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M88 0.083334H175.75V70.3609V140.639H88V210.917H0.25V140.639V70.3609H88V0.083334V0.083334Z"
        className="fill-current"
      />
    </svg>
  );
}

/** Gradient app tile — used for the icon, the login page and the empty sidebar. */
export function LogoTile({ size = 40, className = "", rounded = "rounded-[28%]" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <LogoMark size={size * 0.42} />
    </span>
  );
}

export default function Logo({ size = 28, showWordmark = true, className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoTile size={size * 1.35} />
      {showWordmark ? (
        <span className="text-[17px] font-bold tracking-tight text-foreground">Streamify</span>
      ) : null}
    </span>
  );
}
