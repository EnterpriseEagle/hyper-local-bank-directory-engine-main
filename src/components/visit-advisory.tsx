import type { VisitAdvisory } from "@/lib/visit-advisory";

const STATUS_STYLES: Record<
  VisitAdvisory["status"],
  {
    badge: string;
    border: string;
    glow: string;
    title: string;
    stat: string;
  }
> = {
  good: {
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    border: "border-emerald-500/20 bg-emerald-500/[0.04]",
    glow: "radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(0,0,0,0) 70%)",
    title: "text-emerald-200",
    stat: "text-emerald-300",
  },
  caution: {
    badge: "text-amber-200 bg-amber-500/10 border-amber-500/20",
    border: "border-amber-500/20 bg-amber-500/[0.04]",
    glow: "radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0) 70%)",
    title: "text-amber-100",
    stat: "text-amber-200",
  },
  avoid: {
    badge: "text-red-200 bg-red-500/10 border-red-500/20",
    border: "border-red-500/20 bg-red-500/[0.04]",
    glow: "radial-gradient(circle, rgba(239, 68, 68, 0.16) 0%, rgba(0,0,0,0) 70%)",
    title: "text-red-100",
    stat: "text-red-200",
  },
};

export function VisitAdvisoryCard({
  advisory,
  evidenceLabel = "Live pre-visit signal",
}: {
  advisory: VisitAdvisory;
  evidenceLabel?: string;
}) {
  const styles = STATUS_STYLES[advisory.status];

  return (
    <section className={`relative overflow-hidden border ${styles.border}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: styles.glow }}
      />
      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[640px]">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">
              {evidenceLabel}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${styles.badge}`}>
                {advisory.badge}
              </span>
              <h2 className={`font-serif text-[clamp(1.35rem,2.7vw,2rem)] font-light ${styles.title}`}>
                {advisory.title}
              </h2>
            </div>
            <p className="mt-4 max-w-[620px] text-[15px] leading-[1.7] text-white/60">
              {advisory.summary}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:min-w-[250px]">
            {advisory.stats.map((stat) => (
              <div key={stat.label} className="border border-white/10 bg-black/20 px-4 py-4 text-center">
                <div className={`font-serif text-[1.4rem] font-light ${styles.stat}`}>{stat.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">Why We Say That</p>
            <ul className="mt-3 space-y-3">
              {advisory.reasons.map((reason) => (
                <li key={reason} className="text-[14px] leading-[1.6] text-white/65">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/35">What To Do</p>
            <ul className="mt-3 space-y-3">
              {advisory.actions.map((action) => (
                <li key={action} className="text-[14px] leading-[1.6] text-white/65">
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
