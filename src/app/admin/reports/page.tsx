import { reportsAdminConfigured, hasReportsAdminSession } from "@/lib/reports/auth";
import { SignalBadges } from "@/components/signal-badges";
import {
  createSignedReportPhotoUrl,
  listCommunityReportsByStatus,
  supabaseReportsConfigured,
} from "@/lib/reports/supabase";
import { getBranchModerationTargets } from "@/lib/data";
import {
  buildIncidentBadges,
  getReporterTrustSnapshot,
  groupCommunityReportsIntoIncidents,
} from "@/lib/reports/trust";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type DecoratedReport = {
  photoUrl: string | null;
  report: Awaited<ReturnType<typeof listCommunityReportsByStatus>>[number];
  target: Awaited<ReturnType<typeof getBranchModerationTargets>>[number] | undefined;
};

function shortenHash(hash: string | null) {
  if (!hash) {
    return "n/a";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

function formatReportLabel(reportType: string) {
  return reportType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getQueueData() {
  const [pending, reviewed] = await Promise.all([
    listCommunityReportsByStatus(["pending"], 40),
    listCommunityReportsByStatus(["approved", "rejected"], 20),
  ]);

  const branchIds = Array.from(
    new Set([...pending, ...reviewed].map((report) => report.branch_id))
  );
  const branchTargets = await getBranchModerationTargets(branchIds);
  const branchMap = new Map(branchTargets.map((target) => [target.branchId, target]));

  const decorate = async (report: (typeof pending)[number]): Promise<DecoratedReport> => {
    const target = branchMap.get(report.branch_id);
    const photoUrl =
      report.photo_path && report.photo_bucket
        ? await createSignedReportPhotoUrl(report.photo_bucket, report.photo_path)
        : null;

    return {
      photoUrl,
      report,
      target,
    };
  };

  const decoratedPending = await Promise.all(pending.map(decorate));
  const decoratedReviewed = await Promise.all(reviewed.map(decorate));
  const pendingMap = new Map(decoratedPending.map((item) => [item.report.id, item]));
  const pendingClusters = groupCommunityReportsIntoIncidents(pending).map((cluster) => ({
    badges: buildIncidentBadges(cluster, "admin"),
    items: cluster.reports
      .map((report) => pendingMap.get(report.id))
      .filter((item): item is DecoratedReport => Boolean(item)),
  }));

  return {
    pending: decoratedPending,
    pendingClusters,
    reviewed: decoratedReviewed,
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const invalidToken = params.error === "invalid-token";

  if (!supabaseReportsConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-white">
        <h1 className="font-serif text-4xl font-light">Community Report Queue</h1>
        <p className="mt-4 text-white/60">
          Supabase report storage is not configured yet. Set `SUPABASE_URL`,
          `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_REPORTS_BUCKET` before using the
          moderation queue.
        </p>
      </main>
    );
  }

  if (!reportsAdminConfigured()) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-white">
        <h1 className="font-serif text-4xl font-light">Community Report Queue</h1>
        <p className="mt-4 text-white/60">
          Set `REPORTS_ADMIN_SECRET` to lock down the moderation queue.
        </p>
      </main>
    );
  }

  if (!(await hasReportsAdminSession())) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-white">
        <h1 className="font-serif text-4xl font-light">Community Report Queue</h1>
        <p className="mt-4 text-white/60">
          Enter the moderation secret to review and approve evidence-backed reports.
        </p>
        {invalidToken && (
          <p className="mt-6 border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            Invalid admin token.
          </p>
        )}
        <form action="/api/admin/reports/session" method="post" className="mt-8 space-y-4">
          <input
            type="password"
            name="token"
            placeholder="Moderation secret"
            className="w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            className="border border-white/15 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white transition hover:bg-white/15"
          >
            Unlock Queue
          </button>
        </form>
      </main>
    );
  }

  const { pending, pendingClusters, reviewed } = await getQueueData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-white">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">
            Admin moderation
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light">
            Community Report Queue
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
            Reports with notes and photos land here first. Approving a report syncs it back
            into the live directory data and triggers page revalidation.
          </p>
        </div>

        <form action="/api/admin/reports/session" method="post">
          <input type="hidden" name="intent" value="logout" />
          <button
            type="submit"
            className="border border-white/15 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/5"
          >
            Log Out
          </button>
        </form>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-light">Pending Review</h2>
          <p className="text-sm text-white/40">
            {pendingClusters.length} incident{pendingClusters.length === 1 ? "" : "s"} • {pending.length} evidence item{pending.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-6 grid gap-6">
          {pendingClusters.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] px-6 py-8 text-sm text-white/50">
              No pending reports right now.
            </div>
          ) : (
            pendingClusters.map(({ items, badges }) => {
              const lead = items[0];
              if (!lead) {
                return null;
              }

              const clusterReportIds = items.map((item) => item.report.id).join(",");

              return (
              <article
                key={clusterReportIds}
                className="border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="grid gap-6 border-b border-white/8 pb-6 lg:grid-cols-[1.3fr_0.7fr]">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                      {formatReportLabel(lead.report.report_type)} incident • {lead.target?.branchType ?? "location"}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-light text-white">
                      {lead.target?.branchName ?? `Branch ${lead.report.branch_id}`}
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      {lead.target
                        ? `${lead.target.bankName} • ${lead.target.address}, ${lead.target.suburbName} ${lead.target.postcode}`
                        : `Suburb ${lead.report.suburb_id}`}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-white/55">
                      {items.length} matching evidence item{items.length === 1 ? "" : "s"} were grouped into one incident so you can moderate the signal as a whole instead of chasing duplicates.
                    </p>
                    <SignalBadges badges={badges} className="mt-4" />
                  </div>

                  <form action="/api/admin/reports/moderate" method="post" className="grid gap-3">
                    <input type="hidden" name="scope" value="cluster" />
                    <input type="hidden" name="reportIds" value={clusterReportIds} />
                    <input type="hidden" name="moderator" value="web-admin" />
                    <textarea
                      name="moderationNote"
                      rows={3}
                      placeholder="Cluster moderation note"
                      className="w-full resize-none border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="submit"
                        name="action"
                        value="approved"
                        className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/15"
                      >
                        Approve Cluster
                      </button>
                      <button
                        type="submit"
                        name="action"
                        value="rejected"
                        className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/15"
                      >
                        Reject Cluster
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 grid gap-5">
                  {items.map(({ report, target, photoUrl }) => {
                    const trust = getReporterTrustSnapshot(report);
                    const trustBadges = [
                      ...(report.photo_path || report.photo_sha256
                        ? [{ label: "Proof-backed", tone: "blue" as const }]
                        : []),
                      ...(trust?.level === "trusted"
                        ? [{ label: "Trusted reporter", tone: "emerald" as const }]
                        : trust?.level === "watch"
                        ? [{ label: "Watch reporter", tone: "amber" as const }]
                        : []),
                    ];

                    return (
                      <div
                        key={report.id}
                        className="grid gap-5 border border-white/8 bg-black/20 p-5 lg:grid-cols-[1.3fr_0.7fr]"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
                            <span>{new Date(report.submitted_at).toLocaleString("en-AU")}</span>
                            <span>Agent: {report.agent_recommendation ?? "review"}</span>
                            <span>
                              Confidence:{" "}
                              {report.agent_confidence != null
                                ? `${Math.round(report.agent_confidence * 100)}%`
                                : "n/a"}
                            </span>
                            {trust && (
                              <span>
                                Reporter score: {Math.round(trust.score * 100)}%
                              </span>
                            )}
                          </div>
                          <SignalBadges badges={trustBadges} className="mt-3" />
                          <p className="mt-4 text-sm leading-relaxed text-white/70">
                            {report.note || "No reporter note supplied."}
                          </p>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/45 sm:grid-cols-3">
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                Device
                              </p>
                              <p className="mt-1">
                                {report.camera_make || report.camera_model
                                  ? `${report.camera_make ?? ""} ${report.camera_model ?? ""}`.trim()
                                  : "Unknown"}
                              </p>
                            </div>
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                Metadata
                              </p>
                              <p className="mt-1">{report.photo_metadata_status ?? "none"}</p>
                            </div>
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                Captured
                              </p>
                              <p className="mt-1">
                                {report.captured_at
                                  ? new Date(report.captured_at).toLocaleString("en-AU")
                                  : "Unknown"}
                              </p>
                            </div>
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                GPS
                              </p>
                              <p className="mt-1">
                                {report.capture_distance_km != null
                                  ? `${report.capture_distance_km.toFixed(1)}km from branch`
                                  : report.capture_lat != null && report.capture_lng != null
                                  ? "Present"
                                  : "Missing"}
                              </p>
                            </div>
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                Software
                              </p>
                              <p className="mt-1">{report.camera_software || "Camera default"}</p>
                            </div>
                            <div className="border border-white/8 bg-black/20 px-3 py-2">
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/25">
                                Hash
                              </p>
                              <p className="mt-1">{shortenHash(report.photo_sha256)}</p>
                            </div>
                          </div>
                          {trust && (
                            <p className="mt-4 border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/55">
                              Reporter trust: {trust.summary}
                            </p>
                          )}
                          {report.photo_metadata_summary && (
                            <p className="mt-4 border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/55">
                              {report.photo_metadata_summary}
                            </p>
                          )}
                          {report.vision_summary && (
                            <p className="mt-4 border border-blue-500/10 bg-blue-500/5 px-4 py-3 text-sm text-white/55">
                              Vision review ({report.vision_model || "model"}): {report.vision_summary}
                              {report.vision_authenticity
                                ? ` Authenticity ${report.vision_authenticity}.`
                                : ""}
                              {report.vision_supports_report == null
                                ? ""
                                : report.vision_supports_report
                                ? " Supports the submitted status."
                                : " Does not support the submitted status."}
                            </p>
                          )}
                          {report.agent_summary && (
                            <p className="mt-4 border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/55">
                              {report.agent_summary}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-4">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt="Submitted report evidence"
                              className="h-56 w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-56 items-center justify-center border border-dashed border-white/10 text-sm text-white/30">
                              No photo attached
                            </div>
                          )}

                          <form action="/api/admin/reports/moderate" method="post" className="grid gap-3">
                            <input type="hidden" name="scope" value="report" />
                            <input type="hidden" name="reportId" value={report.id} />
                            <input type="hidden" name="moderator" value="web-admin" />
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="submit"
                                name="action"
                                value="approved"
                                className="border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-500/[0.12]"
                              >
                                Approve Only
                              </button>
                              <button
                                type="submit"
                                name="action"
                                value="rejected"
                                className="border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-xs uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/[0.12]"
                              >
                                Reject Only
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
            })
          )}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-light">Recent Decisions</h2>
          <p className="text-sm text-white/40">{reviewed.length} shown</p>
        </div>

        <div className="mt-6 grid gap-4">
          {reviewed.length === 0 ? (
            <div className="border border-white/10 bg-white/[0.02] px-6 py-8 text-sm text-white/50">
              No moderated reports yet.
            </div>
          ) : (
            reviewed.map(({ report, target }) => (
              <article
                key={report.id}
                className="border border-white/10 bg-white/[0.02] px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      {report.moderation_status} • {report.report_type.replace("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-white/65">
                      {target
                        ? `${target.bankName} ${target.branchName} in ${target.suburbName}`
                        : `Branch ${report.branch_id}`}
                    </p>
                  </div>
                  <p className="text-xs text-white/35">
                    {report.moderated_at
                      ? new Date(report.moderated_at).toLocaleString("en-AU")
                      : "pending"}
                  </p>
                </div>
                {report.moderation_note && (
                  <p className="mt-3 text-sm text-white/50">{report.moderation_note}</p>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
