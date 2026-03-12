import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  markClassName?: string;
  labelClassName?: string;
};

export function SiteLogo({
  className,
  markClassName,
  labelClassName,
}: SiteLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={cn("h-10 w-10 shrink-0", markClassName)}
        fill="none"
      >
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="55"
          rx="18"
          fill="#07111F"
          stroke="rgba(255,255,255,0.14)"
        />
        <path
          d="M19 25.5L32 16L45 25.5"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 29H47"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M22 32V42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M32 32V42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M42 32V42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M18 45H46"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="48" cy="47" r="6" fill="#38BDF8" />
        <circle cx="48" cy="47" r="2.2" fill="#07111F" />
      </svg>

      <span
        className={cn(
          "font-sans text-[13px] font-bold uppercase tracking-[0.16em] text-white",
          labelClassName
        )}
      >
        BANK NEAR ME
        <sup className="relative -top-1 ml-0.5 text-[7px] font-semibold text-white/70">
          ®
        </sup>
      </span>
    </span>
  );
}
