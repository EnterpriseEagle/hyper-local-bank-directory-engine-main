"use client";

import { useRef, useState } from "react";
import { reportEvidenceEnabled, statusReportsEnabled } from "@/lib/feature-flags";

interface StatusReporterProps {
  branches?: { id: number; name: string; type: string; status: string }[];
  branchId?: number;
  branchType?: string;
  suburbId: number;
  suburbName?: string;
}

const REPORT_TYPES = [
  { value: "working", label: "Working", emoji: "✅", color: "emerald" },
  { value: "atm_empty", label: "ATM Empty", emoji: "❌", color: "red" },
  { value: "branch_closed", label: "Branch Closed", emoji: "🚫", color: "red" },
  { value: "closure_notice", label: "Closure Notice", emoji: "📌", color: "amber" },
  { value: "long_queue", label: "Long Queue", emoji: "⏳", color: "amber" },
];

export function StatusReporter({
  branches,
  branchId,
  branchType,
  suburbId,
  suburbName,
}: StatusReporterProps) {
  const singleBranchMode = !!branchId;
  const [selectedBranch, setSelectedBranch] = useState<number | null>(branchId ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  if (!statusReportsEnabled) {
    if (singleBranchMode) {
      return (
        <div className="border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] font-light text-white/40">
          Community reporting opens after launch.
        </div>
      );
    }

    return (
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="border-b border-white/5 px-6 py-5">
          <h3 className="font-serif text-[18px] font-light text-white">
            Community Reporting Opens Soon
          </h3>
          <p className="mt-1 text-[12px] text-white/30">
            We are publishing the directory first. Live reports will be enabled after launch.
          </p>
        </div>
        <div className="px-6 py-6">
          <p className="text-[13px] font-light leading-relaxed text-white/40">
            Browse locations now, then switch reporting on once the production database is ready.
          </p>
        </div>
      </div>
    );
  }

  const activeBranches = branches?.filter((b) => b.status !== "closed") ?? [];
  const selectedBranchType = singleBranchMode
    ? branchType ?? null
    : activeBranches.find((branch) => branch.id === selectedBranch)?.type ?? null;
  const visibleReportTypes = REPORT_TYPES.filter((report) => {
    if (report.value !== "closure_notice") {
      return true;
    }

    return selectedBranchType !== "atm";
  });

  async function handleReport(reportType: string) {
    if (!selectedBranch) {
      setError("Select a branch or ATM first");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const body = reportEvidenceEnabled ? new FormData() : null;

      if (body) {
        body.append("branchId", String(selectedBranch));
        body.append("suburbId", String(suburbId));
        body.append("reportType", reportType);
        if (note.trim()) {
          body.append("note", note.trim());
        }
        if (photo) {
          body.append("photo", photo);
        }
      }

      const res = await fetch("/api/report", {
        method: "POST",
        ...(body
          ? { body }
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                branchId: selectedBranch,
                suburbId,
                reportType,
              }),
            }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || "Failed");
      }

      setSubmitted(true);
      setSubmittedMessage(json?.message || "Report submitted.");
      setNote("");
      setPhoto(null);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-white/10 bg-white/[0.02]">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-5 flex items-center gap-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <div>
          <h3 className="font-serif text-[18px] font-light text-white">
            Live Status Reporter
          </h3>
          {suburbName && (
            <p className="text-[12px] text-white/30 mt-0.5">
              No login. Photo proof helps {suburbName} stay accurate.
            </p>
          )}
        </div>
      </div>

      {submitted ? (
        <div className="px-6 py-10 text-center">
          <span className="text-3xl block mb-3">✅</span>
          <p className="font-serif text-[18px] font-light text-emerald-400 mb-1">
            Report Submitted
          </p>
          <p className="text-[13px] text-white/30">
            {submittedMessage || `Thank you for keeping ${suburbName} updated.`}
          </p>
        </div>
      ) : (
        <div className="px-6 py-6">
          {/* Branch Selector — only in multi-branch mode */}
          {!singleBranchMode && (
            <div className="mb-5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-2 block">
                Select Location
              </label>
              <select
                value={selectedBranch || ""}
                onChange={(e) => {
                  setSelectedBranch(Number(e.target.value) || null);
                  setError("");
                }}
                className="w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-[13px] font-light text-white focus:outline-none focus:border-white/25 transition-colors duration-300 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='rgba(255,255,255,0.3)' stroke-width='1.2'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
              >
                <option value="" className="bg-black text-white/50">
                  Choose a branch or ATM...
                </option>
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-black text-white">
                    {b.name} ({b.type === "atm" ? "ATM" : "Branch"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="mb-4 text-[12px] text-red-400/80 border border-red-500/20 bg-red-500/5 px-3 py-2">
              {error}
            </p>
          )}

          {reportEvidenceEnabled && (
            <div className="mb-5 grid gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-2 block">
                  Optional Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="What did you see? Example: ATM screen said out of service, or a branch had a notice saying it will close next month."
                  className="w-full resize-none bg-white/[0.03] border border-white/10 px-4 py-3 text-[13px] font-light text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors duration-300"
                />
                <p className="mt-2 text-[11px] text-white/20">
                  Helps the review queue understand the report faster.
                </p>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-2 block">
                  Optional Photo
                </label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  className="block w-full text-[12px] text-white/60 file:mr-4 file:border-0 file:bg-white/10 file:px-4 file:py-3 file:text-[11px] file:uppercase file:tracking-[0.18em] file:text-white hover:file:bg-white/15"
                />
                <p className="mt-2 text-[11px] text-white/20">
                  Snap a sign, ATM screen, closure notice, or storefront. Max 8MB.
                </p>
                {photo && (
                  <p className="mt-2 text-[12px] text-white/45">
                    Attached: {photo.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Status Buttons */}
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium mb-3 block">
            Report Status
          </label>
          <div className="grid grid-cols-2 gap-px bg-white/5">
            {visibleReportTypes.map((rt) => (
              <button
                key={rt.value}
                onClick={() => handleReport(rt.value)}
                disabled={submitting}
                className={`group bg-black px-4 py-4 text-center transition-all duration-300 disabled:opacity-40 ${
                  rt.color === "emerald"
                    ? "hover:bg-emerald-500/[0.05]"
                    : rt.color === "red"
                    ? "hover:bg-red-500/[0.05]"
                    : "hover:bg-amber-500/[0.05]"
                }`}
              >
                <span className="text-xl block mb-2">{rt.emoji}</span>
                <span
                  className={`text-[11px] uppercase tracking-[0.15em] font-medium ${
                    rt.color === "emerald"
                      ? "text-emerald-400/70 group-hover:text-emerald-400"
                      : rt.color === "red"
                      ? "text-red-400/70 group-hover:text-red-400"
                      : "text-amber-400/70 group-hover:text-amber-400"
                  } transition-colors duration-300`}
                >
                  {rt.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-white/20 text-center">
            {reportEvidenceEnabled
              ? "Anonymous. Evidence goes into a moderation queue before changing live data."
              : "One tap. Anonymous. Updates the page timestamp for Google freshness."}
          </p>
        </div>
      )}
    </div>
  );
}
