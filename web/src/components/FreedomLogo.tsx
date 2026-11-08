import { cn } from "@/lib/utils";

/** Freedom shield: green shield with the dark-green «F» cut through it. Transparent background. */
export function FreedomMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size * (40 / 48)} height={size} viewBox="0 0 40 48" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <clipPath id="freedom-shield">
          <path d="M0 0H40V27.5C40 38.2 31.2 45.2 20 48C8.8 45.2 0 38.2 0 27.5V0Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#freedom-shield)">
        <rect width="40" height="48" fill="#52B947" />
        <path d="M9 0H40V10.5H20V18.5H34V28.5H20V48H9V0Z" fill="#1E5631" />
      </g>
    </svg>
  );
}

/** Full lockup: shield + FREEDOM wordmark. */
export function FreedomLogo({ height = 28, showWordmark = true, className }: { height?: number; showWordmark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: height * 0.32 }} aria-label="Freedom">
      <FreedomMark size={height} />
      {showWordmark ? (
        <span className="font-display font-extrabold uppercase leading-none text-[#0e0e0d]" style={{ fontSize: height * 0.74, letterSpacing: "0.01em" }}>
          Freedom
        </span>
      ) : null}
    </span>
  );
}
