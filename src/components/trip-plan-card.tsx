import Link from "next/link";
import { SignalBadges } from "@/components/signal-badges";
import type { TripPlan } from "@/lib/trip-plan";

const TONE_STYLES: Record<
  TripPlan["items"][number]["tone"],
  { border: string; title: string }
> = {
  good: {
    border: "border-emerald-500/20 bg-emerald-500/[0.04]",
    title: "text-emerald-100",
  },
  neutral: {
    border: "border-white/10 bg-white/[0.03]",
    title: "text-white",
  },
  warn: {
    border: "border-amber-500/20 bg-amber-500/[0.05]",
    title: "text-amber-100",
  },
};

function ActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="inline-flex text-[10px] uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white/70"
      >
        {label} &rarr;
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex text-[10px] uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white/70"
    >
      {label} &rarr;
    </Link>
  );
}

export function TripPlanCard({
  eyebrow = "Agentic Trip Plan",
  plan,
}: {
  eyebrow?: string;
  plan: TripPlan;
}) {
  return (
    <section className="border border-white/10 bg-white/[0.02]">
      <div className="border-b border-white/8 px-6 py-6 sm:px-8">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-[clamp(1.45rem,3vw,2.1rem)] font-light text-white">
          {plan.title}
        </h2>
        <p className="mt-3 max-w-[720px] text-[14px] leading-[1.7] text-white/45">
          {plan.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/6 lg:grid-cols-3">
        {plan.items.map((item) => {
          const styles = TONE_STYLES[item.tone];
          return (
            <div key={item.title} className={`p-6 sm:p-7 ${styles.border}`}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                {item.tone === "good"
                  ? "Start Here"
                  : item.tone === "warn"
                  ? "Avoid First"
                  : "Backup"}
              </p>
              <h3 className={`mt-3 font-serif text-[1.4rem] font-light ${styles.title}`}>
                {item.title}
              </h3>
              <SignalBadges badges={item.badges} className="mt-4" />
              <p className="mt-4 text-[14px] leading-[1.7] text-white/55">{item.summary}</p>
              {item.href && item.ctaLabel && (
                <div className="mt-5">
                  <ActionLink href={item.href} label={item.ctaLabel} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
