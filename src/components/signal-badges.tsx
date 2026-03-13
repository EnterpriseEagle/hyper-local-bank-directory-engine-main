import type { SignalBadge } from "@/lib/reports/types";

const TONE_STYLES: Record<SignalBadge["tone"], string> = {
  neutral: "border-white/10 bg-white/[0.03] text-white/45",
  emerald: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-200",
  amber: "border-amber-500/20 bg-amber-500/[0.08] text-amber-100",
  blue: "border-sky-500/20 bg-sky-500/[0.08] text-sky-100",
};

export function SignalBadges({
  badges,
  className = "",
}: {
  badges: SignalBadge[];
  className?: string;
}) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {badges.map((badge) => (
        <span
          key={`${badge.tone}-${badge.label}`}
          className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${TONE_STYLES[badge.tone]}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
