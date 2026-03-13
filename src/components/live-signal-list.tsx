import Link from "next/link";
import { SignalBadges } from "@/components/signal-badges";
import type { SignalBadge } from "@/lib/reports/types";

const REPORT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  working: { label: "Working", icon: "✅", color: "text-emerald-400" },
  atm_empty: { label: "ATM Empty", icon: "❌", color: "text-red-400" },
  branch_closed: { label: "Branch Closed", icon: "❌", color: "text-red-400" },
  closure_notice: { label: "Closure Notice", icon: "📌", color: "text-amber-400" },
  long_queue: { label: "Long Queue", icon: "⏳", color: "text-amber-400" },
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export interface LiveSignalListItem {
  badges: SignalBadge[];
  branchName: string;
  createdAt: string;
  href?: string;
  key: string;
  locationLabel?: string;
  reportType: string;
}

export function LiveSignalList({ items }: { items: LiveSignalListItem[] }) {
  return (
    <div className="border-t border-white/5">
      {items.map((item) => {
        const info = REPORT_LABELS[item.reportType] || {
          label: item.reportType,
          icon: "❓",
          color: "text-white/50",
        };
        const content = (
          <>
            <span className="shrink-0 text-base">{info.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-medium uppercase tracking-wide ${info.color}`}
                >
                  {info.label}
                </span>
                <span className="text-white/10">&mdash;</span>
                <span className="truncate text-[13px] font-light text-white/70">
                  {item.branchName}
                </span>
              </div>
              <SignalBadges badges={item.badges} className="mt-2" />
              {item.locationLabel && (
                <p className="mt-1 text-[11px] text-white/25">{item.locationLabel}</p>
              )}
            </div>
            <span className="shrink-0 text-[10px] text-white/20">
              {timeAgo(item.createdAt)}
            </span>
            {item.href && (
              <span className="mt-0.5 shrink-0 text-white/10 transition-all duration-300 group-hover:text-white/30 group-hover:translate-x-1">
                &rarr;
              </span>
            )}
          </>
        );

        return (
          item.href ? (
            <Link
              key={item.key}
              href={item.href}
              className="group flex gap-4 border-b border-white/5 py-4 transition-colors duration-300 hover:bg-white/[0.02]"
            >
              {content}
            </Link>
          ) : (
            <div key={item.key} className="flex gap-4 border-b border-white/5 py-4">
              {content}
            </div>
          )
        );
      })}
    </div>
  );
}
