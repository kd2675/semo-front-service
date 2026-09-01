type SemoBrandMarkProps = {
  className?: string;
  label?: string;
  title?: string;
};

export function SemoBrandMark({
  className,
  label,
  title,
}: SemoBrandMarkProps) {
  const isDecorative = !label;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={isDecorative ? undefined : "img"}
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={label}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M32 6 58 53H6L32 6Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 17 48 46H16L32 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.58"
      />
      <path
        d="m32 25 9 16H23l9-16Z"
        fill="currentColor"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="6" r="2.5" fill="currentColor" />
      <circle cx="58" cy="53" r="2.5" fill="currentColor" />
      <circle cx="6" cy="53" r="2.5" fill="currentColor" />
    </svg>
  );
}
